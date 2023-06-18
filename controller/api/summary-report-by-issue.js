const axios = require("axios");
const moment = require("moment");
const Excel = require("exceljs");
const Bottleneck = require("bottleneck/es5");
const _ = require("lodash");
const FORMAT_DATE = "YYYY/MM/DD";
const CONSTANT = require("../../utils/const");
const username = process.env.JIRA_USERNAME;
const apiToken = process.env.API_TOKEN;
const JiraRepository = require("../../repository/jira-repository/issue.jira.repository.js");
const { getIssuesWithAllWorklogAndChangelog } = require("../../service/jira/index.js");
const logger = require("../../utils/logger.js")(__filename);

//
//
//
// =============================> SERVICE FUNCTION FORM FILTER <=============================//
// =============================> SERVICE FUNCTION FORM FILTER <=============================//
// =============================> SERVICE FUNCTION FORM FILTER <=============================//
//
//
//
//

const getCountIssueList = async (req, res) => {
  const { filters, duration, jiraUrl } = req.body;
  const jqlString = JiraRepository.convertFilterToJql(filters, duration);
  const data = await JiraRepository.getCountIssueList(jiraUrl, jqlString);
  return res.json(data);
};

const getIssueList = async (req, res) => {
  const { filters, progress, page, limit, duration, jiraUrl } = req.body;
  if (progress) {
    let { issues } = await getIssuesWithAllWorklogAndChangelog(jiraUrl, filters, duration);
    issues = await handleIssueList(issues, jiraUrl, duration);
    issues = issues.filter(issue => issue.progress.includes(progress));
    return res.json(issues);
  }
  const jqlString = convertToJqlString(filters, duration);
  const bodyData = {
    expand: ["changelog"],
    jql: jqlString,
    maxResults: limit,
    fieldsByKeys: false,
    fields: [
      "status",
      "summary",
      "description",
      "created",
      "duedate",
      "timetracking",
      "issuelinks",
      "issuetype",
      "assignee",
      "subtasks",
      "worklog"
    ],
    startAt: (page - 1) * limit
  };

  const data = await JiraRepository.searchIssueByJql(jiraUrl, bodyData);
  let issues = await handleIssueList(data.issues, jiraUrl, duration);
  if (duration) issues = issues.filter(item => item.lastUpdatedWithinDuration);
  return res.json(issues);
};

//
//
//
// =============================> API SERVICE <=============================//
// =============================> API SERVICE <=============================//
// =============================> API SERVICE <=============================//
//
//
//
//

const getAllProject = (req, res) => {
  const { recent, jiraUrl } = req.query;
  var query = recent ? "?recent=20" : "";
  var options = {
    method: "GET",
    url: `${jiraUrl}/rest/api/3/project${query}`,
    auth: { username: username, password: apiToken },
    headers: {
      Accept: "application/json"
    }
  };
  axios(options)
    .then(response => {
      return res.json({ data: response.data.filter(item => !item.isPrivate) });
    })
    .catch(error => {
      const { status, data } = error.response;
      return res.status(status).json(data);
    });
};

const getAllStatusesProject = (req, res) => {
  var projectArr = req.query.project.split(",");
  let jiraUrl = req.query.jiraUrl;
  var p = [];
  projectArr.forEach(project => {
    let options = {
      method: "GET",
      url: `${jiraUrl}/rest/api/3/project/${project}/statuses`,
      auth: { username: username, password: apiToken },
      headers: {
        Accept: "application/json"
      }
    };
    p.push(axios(options));
  });
  Promise.all(p)
    .then(responses => {
      var statusList = [];
      responses.forEach(response => {
        statusList = _.unionBy(statusList, response.data[0].statuses, "name");
      });
      return res.json({ data: statusList });
    })
    .catch(errors => {
      logger.error(errors[0].response.data);
    });
};

const getTypeIssueListForChart = async (req, res) => {
  const { filters, jiraUrl, duration } = req.body;
  const jql = convertToJqlString(filters, duration);
  const requestPayload = {
    jql: jql,
    maxResults: 100,
    fieldsByKeys: false,
    fields: ["issuetype", "timespent", "worklog"],
    startAt: 0
  };
  const data = await searchIssuesJql(requestPayload, jiraUrl);
  const { total } = data;
  if (filters.startDate || filters.endDate) {
    if (total <= 100) {
      await Promise.all(
        data.issues.map(async issue => {
          const { worklog } = issue.fields;
          if (worklog.total > worklog.maxResults) {
            issue.fields.worklog = await getIssueWorklogs(issue.key, jiraUrl);
          }
          issue.fields.worklog.worklogs = issue.fields.worklog.worklogs.filter(worklog => {
            let started = moment(worklog.started.substring(0, 10));
            return !moment(filters.startDate).isAfter(started) && !moment(filters.endDate).isBefore(started);
          });
          issue.fields.worklog.total = issue.fields.worklog.worklogs.length;
        })
      );
    } else {
      const countApi = Math.ceil(total / 100) - 1;
      await Promise.all(
        data.issues
          .map(async issue => {
            const { worklog } = issue.fields;
            if (worklog.total > worklog.maxResults) {
              issue.fields.worklog = await getIssueWorklogs(issue.key, jiraUrl);
            }
            issue.fields.worklog.worklogs = issue.fields.worklog.worklogs.filter(worklog => {
              let started = moment(worklog.started.substring(0, 10));
              return !moment(filters.startDate).isAfter(started) && !moment(filters.endDate).isBefore(started);
            });
            issue.fields.worklog.total = issue.fields.worklog.worklogs.length;
          })
          .concat(
            Array.apply(null, Array(countApi)).map(async (item, index) => {
              let startAt = index * 100 + 100;
              let requestPayload = {
                jql: jql,
                maxResults: 100,
                fieldsByKeys: false,
                fields: ["issuetype", "timespent", "worklog"],
                startAt: startAt
              };
              let dataTemp = await searchIssuesJql(requestPayload, jiraUrl);
              await Promise.all(
                dataTemp.issues.map(async (issue, index) => {
                  const { worklog } = issue.fields;
                  if (worklog.total > worklog.maxResults) {
                    issue.fields.worklog = await getIssueWorklogs(issue.key, jiraUrl);
                  }
                  issue.fields.worklog.worklogs = issue.fields.worklog.worklogs.filter(worklog => {
                    let started = moment(worklog.started.substring(0, 10));
                    return !moment(filters.startDate).isAfter(started) && !moment(filters.endDate).isBefore(started);
                  });
                  issue.fields.worklog.total = issue.fields.worklog.worklogs.length;
                })
              );
              data.issues = data.issues.concat(dataTemp.issues);
            })
          )
      );
    }
    data.issues = data.issues.filter(issue => issue.fields.worklog.worklogs.length);
    data.maxResults = data.issues.length;
    data.total = data.issues.length;
  } else {
    if (total > 100) {
      const countApi = Math.ceil(total / 100) - 1;
      await Promise.all(
        Array.apply(null, Array(countApi)).map(async (item, index) => {
          let startAt = index * 100 + 100;
          let requestPayload = {
            jql: jql,
            maxResults: 100,
            fieldsByKeys: false,
            fields: ["issuetype", "timespent"],
            startAt: startAt
          };
          let dataTemp = await searchIssuesJql(requestPayload, jiraUrl);
          data.issues = data.issues.concat(dataTemp.issues);
        })
      );
      data.maxResults = data.issues.length;
    }
  }
  return res.json(data);
};

const getUsersAssignable = (req, res) => {
  var projectArr = req.query.project.split(",");
  let jiraUrl = req.query.jiraUrl;
  var p = [];
  projectArr.forEach(project => {
    let options = {
      method: "GET",
      url: `${jiraUrl}/rest/api/3/user/assignable/multiProjectSearch?projectKeys=${project}`,
      auth: { username: username, password: apiToken },
      headers: {
        Accept: "application/json"
      }
    };
    p.push(axios(options));
  });
  Promise.all(p)
    .then(responses => {
      var assigneeList = [];
      responses.forEach(response => {
        assigneeList = _.unionBy(assigneeList, response.data, "accountId");
      });
      return res.json({ data: assigneeList });
    })
    .catch(errors => {
      logger.error(errors[0].response.data);
    });
};

const getUsersAssignableInProject = (req, res) => {
  let project = req.query.project_key;
  let jiraUrl = req.query.jiraUrl;
  let option = {
    method: "GET",
    url: `${jiraUrl}/rest/api/3/user/assignable/multiProjectSearch?projectKeys=${project}`,
    auth: { username: username, password: apiToken },
    headers: {
      Accept: "application/json"
    }
  };
  axios(option)
    .then(response => {
      return res.json({ data: response.data });
    })
    .catch(error => {
      logger.error(error);
    });
};

const getAllIssueTypes = (req, res) => {
  const { project, jiraUrl } = req.query;
  var options = {
    method: "GET",
    url: `${jiraUrl}/rest/api/3/issue/createmeta?projectKeys=${project}`,
    auth: { username: username, password: apiToken },
    headers: {
      Accept: "application/json"
    }
  };
  axios(options)
    .then(response => {
      var types = [];
      for (const project of response.data.projects) {
        types = _.unionBy(types, project.issuetypes, "name");
      }
      return res.json({ data: types });
    })
    .catch(error => {
      const { status, data } = error.response;
      return res.status(status).json(data);
    });
};

const getAllSprint = async (req, res) => {
  const { project, jiraUrl } = req.query;
  var options = {
    method: "GET",
    url: `${jiraUrl}/rest/agile/1.0/board`,
    auth: { username: username, password: apiToken },
    headers: {
      Accept: "application/json"
    }
  };
  const { data } = await axios(options);
  var boards = _.intersectionWith(data.values, project.split(","), (board, project) => {
    return project === board.location.projectKey;
  });
  var p = [];
  boards.forEach(board => {
    let options = {
      method: "GET",
      url: `${jiraUrl}/rest/agile/1.0/board/${board.id}/sprint`,
      auth: { username: username, password: apiToken },
      headers: {
        Accept: "application/json"
      }
    };
    p.push(axios(options));
  });
  const results = await Promise.all(p.map(promise => promise.catch(e => e)));
  const validResults = results.filter(result => !(result instanceof Error));
  var sprintList = [];
  validResults.forEach(response => {
    sprintList = _.unionBy(sprintList, response.data.values, "id");
  });
  return res.json({ data: sprintList });
};

const getQCD_KPI = async (req, res) => {
  const { filters, progress, duration, jiraUrl } = req.body;
  let { issues } = await getIssuesWithAllWorklogAndChangelog(jiraUrl, filters, duration);
  issues = await handleIssueList(issues, jiraUrl, duration);
  issues = issues.filter(issue => issue.progress.includes(progress));

  const quality = {
    bugRatioByNumber: {
      count: 0,
      total: issues.length
    },
    bugRatioByHour: {
      bugHour: 0,
      issueHour: 0
    }
  };
  const cost = {
    actualManhour: 0,
    estimateManhour: 0
  };
  const delivery = {
    issueBeforeDuedate: issues.length,
    totalIssue: issues.length
  };
  issues.map(item => {
    if (item.type.name == "Bug") {
      quality.bugRatioByNumber.count++;
      if (_.isNumber(item.actualManhour)) quality.bugRatioByHour.bugHour += item.actualManhour;
    }
    if (_.isNumber(item.actualManhour)) {
      cost.actualManhour += item.actualManhour;
      quality.bugRatioByHour.issueHour += item.actualManhour;
    }

    if (_.isNumber(item.planManhour)) cost.estimateManhour += item.planManhour;

    if (item.progress == "behind_schedule") delivery.issueBeforeDuedate--;
  });
  cost.actualManhour = _.round(cost.actualManhour, 2);
  cost.estimateManhour = _.round(cost.estimateManhour, 2);
  quality.bugRatioByHour.bugHour = _.round(quality.bugRatioByHour.bugHour, 2);
  quality.bugRatioByHour.issueHour = _.round(quality.bugRatioByHour.issueHour, 2);
  return res.json({ quality, cost, delivery });
};

//
//
//
// =============================> EXCEL HANDLE SERVICE <=============================//
// =============================> EXCEL HANDLE SERVICE <=============================//
// =============================> EXCEL HANDLE SERVICE <=============================//
//
//
//
//
const exportJiraQcdReport = async (req, res) => {
  const { filters, progress, jiraUrl, duration } = req.body;
  let projects = await getProjectsBy(jiraUrl, filters.project);
  let projectNameObj = projects.reduce((x, y) => ({ name: `${x.name}_${y.name}` }));
  let projectName = projectNameObj.name.replace(/ /g, "");
  var progressValue = "";
  if (progress) {
    var progressKey = _.findKey(CONSTANT.PROGRESS, o => {
      return o.key === progress;
    });
    progressValue = CONSTANT.PROGRESS[progressKey].value;
  }
  let issues = await getIssuesWithAllWorklogAndChangelog(jiraUrl, filters, duration);
  issues = await handleIssueListForExport(issues, jiraUrl, duration);
  issues = issues.filter(issue => issue.progress.includes(progress));
  if (duration) issues = issues.filter(item => item.lastUpdatedWithinDuration);

  // create xlsx
  const now = moment().format("YYYYMMDD");
  var workbook = writeIssueToExcel(issues);

  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
  res.setHeader("Content-Disposition", `attachment; filename=QCD_Summary_${projectName}_${now}.xlsx`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  workbook.xlsx.write(res).then(function () {
    res.end();
  });
};

const exportOriginData = async (req, res) => {
  const { filters, jiraUrl, duration } = req.body;
  let projects = await getProjectsBy(jiraUrl, filters.project);
  let projectNameObj = projects.reduce((x, y) => ({ name: `${x.name}_${y.name}` }));
  let projectName = projectNameObj.name.replace(/ /g, "");
  let issues = await getIssuesWithAllWorklogAndChangelog(jiraUrl, filters, duration);
  issues = await handleIssueListForExportOriginData(issues, jiraUrl, duration);

  if (duration) issues = issues.filter(item => item.lastUpdatedWithinDuration);

  // create xlsx
  const now = moment().format("YYYYMMDD");
  var workbook = writeIssueOriginDataToExcel(issues);

  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
  res.setHeader("Content-Disposition", `attachment; filename=OriginalData_${projectName}_${now}.xlsx`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  workbook.xlsx.write(res).then(function () {
    res.end();
  });
};

const exportQCDToPDF = async (req, res) => {
  const puppeteer = require("puppeteer");
  const fs = require("fs");
  const path = require("path");
  const hbs = require("handlebars");
  hbs.registerHelper("getClassForBugRatioByNumber", function (value) {
    if (value < 3.0) return "qcd-gold";
    else if (value < 6.0) return "qcd-sliver";
    else if (value < 11.0) return "qcd-bronze";
    else return "text-danger";
  });
  hbs.registerHelper("getClassForOverEstimate", function (value) {
    if (value < 6.0) return "qcd-gold";
    else if (value < 11.0) return "qcd-sliver";
    else if (value < 16.0) return "qcd-bronze";
    else return "text-danger";
  });
  hbs.registerHelper("getClassForOverDueDate", function (value) {
    if (value >= 90.0) return "qcd-gold";
    else if (value >= 80.0) return "qcd-sliver";
    else if (value >= 70.0) return "qcd-bronze";
    else return "text-danger";
  });

  const compile = data => {
    const html = fs.readFileSync(path.join(__dirname, "../../utils/qcd-template.hbs"));
    return hbs.compile(html.toString())(data);
  };

  try {
    const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    const content = compile(req.body);
    await page.setContent(content);
    await page.emulateMediaType("screen");
    const dataPDF = await page.pdf({
      format: "A4",
      printBackground: true
    });
    await browser.close();
    res.contentType("application/pdf");
    res.send(dataPDF);
  } catch (error) {
    logger.error("catch error", error);
  }
};

const getProjectsBy = async (jiraUrl, projectKeys) => {
  var options = {
    method: "GET",
    url: `${jiraUrl}/rest/api/3/project`,
    auth: { username: username, password: apiToken },
    headers: {
      Accept: "application/json"
    }
  };

  let response = await axios(options);
  if (projectKeys) {
    return response.data.filter(x => projectKeys.includes(x.key));
  }
  return response.data;
};

const writeIssueToExcel = issues => {
  let rows = issues.map((item, index) => {
    // Re-sort order before write excel
    let clone = {
      type: item.type,
      key: item.key,
      issueName: item.issueName,
      assignee: item.assignee,
      status: item.status,
      degrate: item.degrate,
      issueCreatedDate: item.issueCreatedDate,
      progress: item.progress,
      lastUpdatedWithinDuration: item.lastUpdatedWithinDuration,
      answerDueDate: item.answerDueDate,
      actualFinishedDate: item.actualFinishedDate,
      differenceDate: item.differenceDate,
      planManhour: item.planManhour,
      actualManhour: item.actualManhour,
      differenceManhour: item.differenceManhour,
      relatedResourceForFixBug: item.relatedResourceForFixBug,
      totalManhour: item.totalManhour,
      bugRatio: item.bugRatio,
      manhourForBug: item.manhourForBug,
      totalJugementLevel: item.totalJugementLevel
    };
    let row = _.values(clone);
    row.unshift(index + 1);
    return row;
  });
  var workbook = new Excel.Workbook();
  workbook.creator = "anhbui";
  workbook.lastModifiedBy = "anhbui";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.lastPrinted = new Date();
  workbook.properties.date1904 = true;

  var worksheet = workbook.addWorksheet("QCD Management");
  let columns = [
    {
      name: "No",
      cell: "A1",
      width: 4,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Type",
      cell: "B1",
      width: 12,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Issue key",
      cell: "C1",
      width: 9,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Issue name",
      cell: "D1",
      width: 55,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Assignee",
      cell: "E1",
      width: 15,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Status",
      cell: "F1",
      width: 15,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Degrate",
      cell: "G1",
      width: 15,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Issue create date",
      cell: "H1",
      width: 15,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Progress",
      cell: "I1",
      width: 10,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Last updated within duration",
      cell: "J1",
      width: 20,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Answer due date",
      cell: "K1",
      width: 15,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Actual finished date",
      cell: "L1",
      width: 15,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Difference date",
      cell: "M1",
      width: 15,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Plan man hour",
      cell: "N1",
      width: 15,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Actual man hour",
      cell: "O1",
      width: 15,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Difference man hour",
      cell: "P1",
      width: 15,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Resource to fix related bugs",
      cell: "Q1",
      width: 15,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Total man hour",
      cell: "R1",
      width: 15,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Bug ratio (Resource to fix related bugs/Total man hour)",
      cell: "S1",
      width: 15,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Man hours for bugs",
      cell: "T1",
      width: 15,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Total jugement level",
      cell: "U1",
      width: 20,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF0000" }
      }
    }
  ];
  worksheet.addTable({
    name: "JiraReportTable",
    ref: "A1",
    headerRow: true,
    columns: columns,
    rows: rows
  });
  columns.forEach((column, index) => {
    // merge cell
    // worksheet.mergeCells(mergeCells);
    worksheet.getCell(column.cell).value = column.name;
    worksheet.getCell(column.cell).alignment = {
      vertical: "middle",
      horizontal: "center"
    };
    // column width
    worksheet.getColumn(index + 1).width = column.width;
    // column color
    worksheet.getCell(column.cell).fill = column.fill;
  });

  var borderStyles = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" }
  };
  worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
    row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
      cell.border = borderStyles;
      const colsAlignRight = [7, 9, 10, 11, 17];
      if (rowNumber > 1) {
        if (colsAlignRight.indexOf(colNumber) > -1) {
          cell.alignment = { horizontal: "right" };
        }
      }
    });
  });
  return workbook;
};

const writeIssueOriginDataToExcel = issues => {
  var rows = [];
  for (let i = 0; i < issues.length; i++) {
    let row = _.values(issues[i]);
    rows.push(row);
  }
  var workbook = new Excel.Workbook();
  workbook.creator = "anhbui";
  workbook.lastModifiedBy = "anhbui";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.lastPrinted = new Date();
  workbook.properties.date1904 = true;

  var worksheet = workbook.addWorksheet("Original data");
  let columns = [
    {
      cell: "A1",
      name: "Bug Type",
      width: 17,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF00" }
      }
    },
    {
      cell: "B1",
      name: "Current Status",
      width: 17,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF00" }
      }
    },
    {
      cell: "C1",
      name: "Degrate",
      width: 8,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF00" }
      }
    },
    {
      cell: "D1",
      name: "Issue ID",
      width: 8,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF00" }
      }
    },
    {
      cell: "E1",
      name: "Parent Issue Key",
      width: 15,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF00" }
      }
    },
    {
      cell: "F1",
      name: "Parent Issue Type",
      width: 15,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF00" }
      }
    },
    {
      cell: "G1",
      name: "キー",
      width: 7,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF00" }
      }
    },
    {
      cell: "H1",
      name: "Created (MM/dd/yyyy) (月/日/年)",
      width: 25,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF00" }
      }
    },
    {
      name: "Last updated within duration",
      cell: "I1",
      width: 20,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF0000" }
      }
    },
    {
      cell: "J1",
      name: "期日 (月/日/年)",
      width: 12,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF00" }
      }
    },
    {
      cell: "K1",
      name: "解決日 (MM/dd/yyyy) (月/日/年)",
      width: 25,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF00" }
      }
    },
    {
      cell: "L1",
      name: "要約",
      width: 80,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF00" }
      }
    },
    {
      cell: "M1",
      name: "課題タイプ",
      width: 16,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF00" }
      }
    },
    {
      cell: "N1",
      name: "Original Estimate (合計)",
      width: 35,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF00" }
      }
    },
    {
      cell: "O1",
      name: "Remaining Estimate (合計)",
      width: 35,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF00" }
      }
    },
    {
      cell: "P1",
      name: "Time Spent (合計)",
      width: 30,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF00" }
      }
    },
    {
      cell: "Q1",
      name: "作業比率 (合計)",
      width: 14,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF00" }
      }
    }
  ];
  worksheet.addTable({
    name: "Table",
    ref: "A1",
    headerRow: true,
    columns: columns,
    rows: rows
  });
  columns.forEach((column, index) => {
    // column width
    worksheet.getColumn(index + 1).width = column.width;
  });
  var borderStyles = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" }
  };
  worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
    row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
      cell.border = borderStyles;
    });
  });
  return workbook;
};

//
//
//
// =============================> CALL JIRA API <=============================//
// =============================> CALL JIRA API <=============================//
// =============================> CALL JIRA API <=============================//
//
//
//
//

const convertToJqlString = (filters, duration) => {
  let filtersJql = [];
  let orderCondition = " order by created DESC";
  Object.entries(filters).map(([key, val]) => {
    if (Array.isArray(val) && val.length) {
      // if filter[key] is an array
      let jqlVal = val.map(item => `"${item}"`).join(",");
      filtersJql.push(`${key} in (${jqlVal})`);
    }
  });

  if (duration && duration.length) {
    let startCondition = ` AND worklogDate >= "${duration[0]}"`;
    let endCondition = ` AND worklogDate <= "${duration[1]}"`;
    return filtersJql.join(" AND ") + startCondition + endCondition + orderCondition;
  }
  return filtersJql.join(" AND ") + orderCondition;
};

const searchIssuesJql = async (requestPayload, jiraUrl) => {
  var options = {
    method: "POST",
    url: `${jiraUrl}/rest/api/3/search`,
    auth: { username: username, password: apiToken },
    headers: {
      Accept: "application/json"
    },
    data: requestPayload
  };
  const { data } = await axios(options);
  return data;
};

const getIssueWorklogs = async (issueIdOrKey, jiraUrl) => {
  var options = {
    method: "GET",
    url: `${jiraUrl}/rest/api/3/issue/${issueIdOrKey}/worklog?startAt=0&maxResults=1000`,
    auth: { username: username, password: apiToken },
    headers: {
      Accept: "application/json"
    }
  };
  const { data } = await axios(options);
  return data;
};

const getChangelogIssueById = async (issueId, jiraUrl) => {
  var options = {
    method: "GET",
    url: `${jiraUrl}/rest/api/3/issue/${issueId}/changelog`,
    auth: { username: username, password: apiToken },
    headers: {
      Accept: "application/json"
    }
  };
  const { data } = await axios(options);
  const { total } = data;
  if (total > 100) {
    const countApi = Math.ceil(total / 100) - 1;
    var p = [];
    for (let i = 0; i < countApi; i++) {
      let startAt = (i + 1) * 100;
      let option = {
        method: "GET",
        url: `${jiraUrl}/rest/api/3/issue/${issueId}/changelog?startAt=${startAt}`,
        auth: { username: username, password: apiToken },
        headers: {
          Accept: "application/json"
        }
      };
      p[i] = axios(option);
    }
    const datas = await Promise.all(p);
    var values = [];
    values = values.concat(data.values);
    datas.map(data => {
      values = values.concat(data.data.values);
    });
    return values;
  } else {
    return data.values;
  }
};

const getManhourForBug = (issueId, jiraUrl) => {
  var options = {
    method: "GET",
    url: `${jiraUrl}/rest/api/3/issue/${issueId}?fields=timetracking`,
    auth: { username: username, password: apiToken },
    headers: {
      Accept: "application/json"
    }
  };
  return axios(options);
};

//
//
//
// =============================> SOME HANDLE FUNCTION <=============================//
// =============================> SOME HANDLE FUNCTION <=============================//
// =============================> SOME HANDLE FUNCTION <=============================//
//
//
//
//

const handleIssueListForExportOriginData = async (issues, jiraUrl, duration) => {
  const limiter = new Bottleneck({
    minTime: 100
  });
  var issueList = [];
  let sum = 0;
  let totalWorklog = 0;
  await limiter.schedule(() => {
    return Promise.all(
      issues.map(async element => {
        var { fields } = element;
        var issue = {
          bugType: fields.customfield_10100 ? fields.customfield_10100.value : "",
          currentStatus: fields.status.name,
          degrate: fields.customfield_11130 ? fields.customfield_11130.value : "",
          issueId: parseInt(element.id),
          parentIssueKey: fields.parent ? fields.parent.key : "",
          parentIssueType: fields.parent ? fields.parent.fields.issuetype.name : "",
          key: element.key,
          created: moment(fields.created).format(FORMAT_DATE)
        };
        const { worklog } = fields;

        if (duration) {
          worklog.worklogs.map(item => {
            if (moment(item.created).isBetween(duration[0], duration[1])) {
              issue.lastUpdatedWithinDuration = moment(item.created).format("YYYY-MM-DD HH:mm:ss");
            }
          });
        } else if (worklog.total) {
          let lastItem = worklog.worklogs[worklog.worklogs.length - 1];
          issue.lastUpdatedWithinDuration = moment(lastItem.created).format("YYYY-MM-DD HH:mm:ss");
        } else issue.lastUpdatedWithinDuration = "";

        issue.answerDueDate = fields.duedate ? moment(fields.duedate).format(FORMAT_DATE) : "";

        if (element.changelog.total > 100) {
          const changelog = await getChangelogIssueById(element.key, jiraUrl);
          var waitingUATS = changelog.filter(element => {
            return _.find(element.items, { toString: "Waiting UAT" });
          });
          if (waitingUATS.length) {
            issue.actualFinishedDate = moment(waitingUATS[waitingUATS.length - 1].created).format(FORMAT_DATE);
          } else {
            var resolveds = changelog.filter(element => {
              return _.find(element.items, { toString: "Resolved" });
            });
            issue.actualFinishedDate = resolveds.length
              ? moment(resolveds[resolveds.length - 1].created).format(FORMAT_DATE)
              : "";
          }
        } else {
          var { histories } = element.changelog;
          var waitingUATS = histories.filter(element => {
            return _.find(element.items, { toString: "Waiting UAT" });
          });
          if (waitingUATS.length) {
            issue.actualFinishedDate = moment(waitingUATS[0].created).format(FORMAT_DATE);
          } else {
            var resolveds = histories.filter(element => {
              return _.find(element.items, { toString: "Resolved" });
            });
            issue.actualFinishedDate = resolveds.length ? moment(resolveds[0].created).format(FORMAT_DATE) : "";
          }
        }
        issue.issueName = fields.summary;
        issue.issueType = fields.issuetype ? fields.issuetype.name : "";

        const { originalEstimateSeconds, remainingEstimateSeconds, timeSpentSeconds } = fields.timetracking;
        issue.originalEstimate = originalEstimateSeconds ? Math.round((originalEstimateSeconds / 3600) * 100) / 100 : 0;
        issue.remainingEstimate = remainingEstimateSeconds
          ? Math.round((remainingEstimateSeconds / 3600) * 100) / 100
          : 0;
        let worklogInDuration = getWorklogInDuration(worklog.worklogs, duration);
        issue.timeSpent = worklogInDuration.reduce((sum, item) => sum + item.timeSpentSeconds, 0);
        issue.timeSpent = +(issue.timeSpent / 3600).toFixed(2);
        totalWorklog += worklogInDuration.length;

        // issue.timeSpent = timeSpentSeconds ? Math.round((timeSpentSeconds / 3600) * 100) / 100 : 0;
        const { originalEstimate, timeSpent } = issue;
        issue.workRatio = originalEstimate && timeSpent ? +(timeSpent / originalEstimate).toFixed(2) * 100 : 0;

        issueList.push(issue);
      })
    );
  });

  return issueList;
};

const handleIssueListForExport = async (issues, jiraUrl, duration) => {
  let mapWorklog = {};
  let issueList = [];
  await Promise.all(
    issues.map(async element => {
      var { fields } = element;
      var issue = {
        type: fields.issuetype.name,
        key: element.key,
        issueName: fields.summary,
        assignee: fields.assignee ? fields.assignee.displayName : "",
        status: fields.status.name,
        degrate: fields.customfield_11130 ? fields.customfield_11130.value : "",
        issueCreatedDate: moment(fields.created).format(FORMAT_DATE)
      };
      const { worklog, subtasks } = fields;
      var subOriginalEstimate = 0;
      var subTimeSpent = 0;
      issue.answerDueDate = fields.duedate ? moment(fields.duedate).format(FORMAT_DATE) : "";
      // Change log
      if (element.changelog.total > 100) {
        const changelog = await getChangelogIssueById(element.key, jiraUrl);
        var waitingUATS = changelog.filter(element => {
          return _.find(element.items, { toString: "Waiting UAT" });
        });
        if (waitingUATS.length) {
          issue.actualFinishedDate = moment(waitingUATS[waitingUATS.length - 1].created).format(FORMAT_DATE);
        } else {
          var resolveds = changelog.filter(element => {
            return _.find(element.items, { toString: "Resolved" });
          });
          issue.actualFinishedDate = resolveds.length
            ? moment(resolveds[resolveds.length - 1].created).format(FORMAT_DATE)
            : "";
        }
      } else {
        var { histories } = element.changelog;
        var waitingUATS = histories.filter(element => {
          return _.find(element.items, { toString: "Waiting UAT" });
        });
        if (waitingUATS.length) {
          issue.actualFinishedDate = moment(waitingUATS[0].created).format(FORMAT_DATE);
        } else {
          var resolveds = histories.filter(element => {
            return _.find(element.items, { toString: "Resolved" });
          });
          issue.actualFinishedDate = resolveds.length ? moment(resolveds[0].created).format(FORMAT_DATE) : "";
        }
      }

      // Difference date
      if (issue.actualFinishedDate && issue.answerDueDate) {
        var actual = moment(new Date(issue.actualFinishedDate.substring(0, 10)));
        var answer = moment(new Date(issue.answerDueDate));
        issue.differenceDate = actual.diff(answer, "days");
      } else {
        issue.differenceDate = "";
      }

      // Progress
      issue.progress = handleProgress(issue.issueCreatedDate, issue.actualFinishedDate, issue.answerDueDate, true);
      const { originalEstimateSeconds, timeSpentSeconds } = fields.timetracking;
      issue.planManhour = +((subOriginalEstimate + (originalEstimateSeconds || 0)) / 3600).toFixed(2) || "";
      issue.actualManhour = +((subTimeSpent + (timeSpentSeconds || 0)) / 3600).toFixed(2) || "";

      // Difference Manhour
      if (issue.planManhour && issue.actualManhour) {
        issue.differenceManhour = +(issue.planManhour - issue.actualManhour).toFixed(2);
      } else {
        issue.differenceManhour = "";
      }

      // Quality Group
      // Man hour for bug
      if (fields.issuelinks.length) {
        const BUG = "Bug";
        var relatedResourceForFixBug = 0;
        for (const issue of fields.issuelinks) {
          if (issue.outwardIssue && issue.outwardIssue.fields.issuetype.name === BUG) {
            const issueId = issue.outwardIssue.key;
            const { data } = await getManhourForBug(issueId, jiraUrl);
            const { timeSpentSeconds } = data.fields.timetracking;
            relatedResourceForFixBug += timeSpentSeconds / 3600;
          }
        }
        issue.relatedResourceForFixBug = +relatedResourceForFixBug.toFixed(2);
      } else {
        issue.relatedResourceForFixBug = 0;
      }

      issue.totalManhour = Math.round((issue.actualManhour + issue.relatedResourceForFixBug) * 100) / 100;
      issue.bugRatio = issue.relatedResourceForFixBug
        ? ((issue.relatedResourceForFixBug / issue.totalManhour) * 100).toFixed(2) + "%"
        : 0 + "%";

      //
      const BUG = "Bug";
      if (fields.issuetype.name == BUG) issue.manhourForBug = issue.actualManhour;
      else issue.manhourForBug = 0;
      issue.totalJugementLevel = "";
      // lastUpdatedWithinDuration
      if (duration) {
        worklog.worklogs.map(item => {
          if (moment(item.updated).isBetween(duration[0], duration[1])) {
            issue.lastUpdatedWithinDuration = moment(item.created).format("YYYY-MM-DD HH:mm:ss");
          }
        });
      } else if (worklog.total) {
        let lastItem = worklog.worklogs[worklog.worklogs.length - 1];
        issue.lastUpdatedWithinDuration = moment(lastItem.created).format("YYYY-MM-DD HH:mm:ss");
      }

      issue.parent = fields.parent;
      issue.worklog = worklog;
      issueList.push(issue);
      if (mapWorklog[issue.key]) {
        mapWorklog[issue.key].total += worklog.total;
        mapWorklog[issue.key].timeSpent += worklog.worklogs.reduce((sum, item) => sum + item.timeSpentSeconds, 0);
      } else {
        mapWorklog[issue.key] = {
          total: worklog.total,
          timeSpent: worklog.worklogs.reduce((sum, item) => sum + item.timeSpentSeconds, 0)
        };
      }
    })
  );

  // build Map parent
  mapParrentIssues = {};
  // Build Map issues follow parentIssueKey
  isHasParent = function (item) {
    return item.parent;
  };

  let sumWork = 0;
  let totalIsues = [];
  issueList.forEach(item => {
    totalIsues.push(item.key);
    let worklogInDuration = getWorklogInDuration(item.worklog.worklogs, duration);
    item.actualManhour = worklogInDuration.reduce((sum, item) => sum + item.timeSpentSeconds, 0);
    sumWork += worklogInDuration.length;
    if (isHasParent(item)) {
      // Neu la sub Issue
      if (!mapParrentIssues[item.parent.key]) {
        let parrent = _.cloneDeep(item);
        parrent.worklog = [];
        parrent.actualManhour = 0;
        parrent.key = item.parent.key;
        mapParrentIssues[item.parent.key] = {
          subIssues: [],
          info: parrent
        };
      }

      mapParrentIssues[item.parent.key].subIssues.push(item);
    } else {
      //Neu la Parrent Issue
      if (!mapParrentIssues[item.key]) {
        mapParrentIssues[item.key] = {
          subIssues: [],
          info: item
        };
      } else {
        mapParrentIssues[item.key].info = item;
      }
    }
  });

  // rebuild Map parent

  Object.keys(mapParrentIssues).map(parentKey => {
    parentIssue = mapParrentIssues[parentKey];
    parentIssue.info.totalTimeSpent = parentIssue.subIssues.reduce((sum, item) => +sum + item.actualManhour, 0);
  });

  let convertMapParentToList = [];
  let sum = 0;
  for (const key in mapParrentIssues) {
    const element = mapParrentIssues[key];
    element.info.progress = element.info.progress ? element.info.progress : "";
    element.info.actualManhour = +((element.info.actualManhour + element.info.totalTimeSpent) / 3600).toFixed(2);
    sum += element.info.actualManhour;
    convertMapParentToList.push(element.info);
  }
  return convertMapParentToList;
};

const handleIssueList = async (issues, jiraUrl, duration) => {
  const limiter = new Bottleneck({
    minTime: 100
  });

  var issueList = [];
  await limiter.schedule(() => {
    return Promise.all(
      issues.map(async element => {
        var { fields } = element;
        var issue = {
          type: fields.issuetype,
          key: element.key,
          issueName: fields.summary,
          assignee: fields.assignee,
          status: fields.status,
          issueCreatedDate: moment(fields.created).format(FORMAT_DATE)
        };
        const { worklog, status, subtasks } = fields;
        var subOriginalEstimate = 0;
        var subTimeSpent = 0;
        if (subtasks.length) {
          var subtaskKeys = subtasks.map(task => task.key).join(",");
          var options = {
            method: "GET",
            url: `${jiraUrl}/rest/api/3/search?jql=issueKey in (${subtaskKeys})&fields=timetracking, duedate`,
            auth: { username: username, password: apiToken },
            headers: {
              Accept: "application/json"
            }
          };
          try {
            const { data } = await limiter.schedule(() => axios(options));
            let duedateArr = [];
            if (fields.duedate) duedateArr.push(fields.duedate);
            for (const issue of data.issues) {
              let { originalEstimateSeconds, timeSpentSeconds } = issue.fields.timetracking;
              subOriginalEstimate += originalEstimateSeconds ? originalEstimateSeconds : 0;
              subTimeSpent += timeSpentSeconds ? timeSpentSeconds : 0;
              if (issue.fields.duedate) {
                duedateArr.push(issue.fields.duedate);
              }
            }
            duedateArr.sort(function (a, b) {
              a = a.split("-").join("");
              b = b.split("-").join("");
              return a > b ? 1 : a < b ? -1 : 0;
            });
            issue.answerDueDate = duedateArr.length
              ? moment(duedateArr[duedateArr.length - 1]).format(FORMAT_DATE)
              : "";
          } catch (e) {
            logger.error(e);
          }
        } else {
          issue.answerDueDate = fields.duedate ? moment(fields.duedate).format(FORMAT_DATE) : "";
        }

        const changelog =
          element.changelog.total > 100
            ? await getChangelogIssueById(element.key, jiraUrl)
            : element.changelog.histories;

        const waitingUATS = changelog.filter(element => {
          return _.find(element.items, { toString: "Waiting UAT" });
        });

        const resolveds = changelog.filter(element => {
          return _.find(element.items, { toString: "Resolved" });
        });

        if (status.name == "Waiting UAT" || status.name == "UAT in progress") {
          issue.actualFinishedDate = moment(waitingUATS[waitingUATS.length - 1].created).format(FORMAT_DATE);
        } else if (status.name == "Resolved") {
          if (waitingUATS.length) {
            issue.actualFinishedDate = moment(waitingUATS[waitingUATS.length - 1].created).format(FORMAT_DATE);
          } else {
            issue.actualFinishedDate = moment(resolveds[resolveds.length - 1].created).format(FORMAT_DATE);
          }
        } else issue.actualFinishedDate = "";

        // Difference date
        if (issue.actualFinishedDate && issue.answerDueDate) {
          var actual = moment(new Date(issue.actualFinishedDate));
          var answer = moment(new Date(issue.answerDueDate));
          issue.differenceDate = actual.diff(answer, "days");
        } else {
          issue.differenceDate = "";
        }

        // progress
        issue.progress = handleProgress(issue.issueCreatedDate, issue.actualFinishedDate, issue.answerDueDate);
        const { originalEstimateSeconds, timeSpentSeconds } = fields.timetracking;
        issue.planManhour = +((subOriginalEstimate + (originalEstimateSeconds || 0)) / 3600).toFixed(2) || "";
        issue.actualManhour = +((subTimeSpent + (timeSpentSeconds || 0)) / 3600).toFixed(2) || "";

        // Difference Manhour
        if (issue.planManhour && issue.actualManhour) {
          issue.differenceManhour = +(issue.planManhour - issue.actualManhour).toFixed(2);
        } else {
          issue.differenceManhour = "";
        }

        // Quality
        if (fields.issuelinks.length) {
          const BUG = "Bug";
          var relatedResourceForFixBug = 0;
          for (const issue of fields.issuelinks) {
            if (issue.outwardIssue && issue.outwardIssue.fields.issuetype.name === BUG) {
              const issueId = issue.outwardIssue.key;
              const { data } = await getManhourForBug(issueId, jiraUrl);
              const { timeSpentSeconds } = data.fields.timetracking;
              relatedResourceForFixBug += timeSpentSeconds / 3600;
            }
          }
          issue.relatedResourceForFixBug = +relatedResourceForFixBug.toFixed(2);
        } else {
          issue.relatedResourceForFixBug = 0;
        }

        issue.totalManhour = Math.round((issue.actualManhour + issue.relatedResourceForFixBug) * 100) / 100;
        issue.bugRatio = issue.relatedResourceForFixBug
          ? ((issue.relatedResourceForFixBug / issue.totalManhour) * 100).toFixed(2) + "%"
          : 0 + "%";

        // Just show bug
        const BUG = "Bug";
        if (fields.issuetype.name == BUG) issue.manhourForBug = issue.actualManhour;
        else issue.manhourForBug = 0;

        issue.totalJugementLevel = "";

        if (worklog.total) {
          let lastItem = worklog.worklogs[worklog.worklogs.length - 1];
          issue.lastUpdatedWithinDuration = moment(lastItem.created).format("YYYY-MM-DD HH:mm:ss");
        }

        issueList.push(issue);
      })
    );
  });
  return issueList;
};

const handleProgress = (created, actual, answer, isExport) => {
  const { PROGRESS } = CONSTANT;
  const AHEAD_OF_SCHEDULE = isExport ? PROGRESS.AHEAD_OF_SCHEDULE.value : PROGRESS.AHEAD_OF_SCHEDULE.key;
  const BEHIND_SCHEDULE = isExport ? PROGRESS.BEHIND_SCHEDULE.value : PROGRESS.BEHIND_SCHEDULE.key;
  const ON_SCHEDULE = isExport ? PROGRESS.ON_SCHEDULE.value : PROGRESS.ON_SCHEDULE.key;
  var progress = "";
  if (actual && answer) {
    if (moment(actual, FORMAT_DATE).isBefore(moment(answer, FORMAT_DATE))) {
      progress = AHEAD_OF_SCHEDULE;
    } else if (moment(actual, FORMAT_DATE).isAfter(moment(answer, FORMAT_DATE))) {
      progress = BEHIND_SCHEDULE;
    } else {
      progress = ON_SCHEDULE;
    }
  } else if (!actual && answer) {
    if (moment(created, FORMAT_DATE).isBefore(moment(answer, FORMAT_DATE))) {
      progress = ON_SCHEDULE;
    } else if (moment(created, FORMAT_DATE).isAfter(moment(answer, FORMAT_DATE))) {
      progress = BEHIND_SCHEDULE;
    } else {
    }
  } else if (actual && !answer) {
  } else {
  }
  return progress;
};

const getWorklogInDuration = (worklogs, duration) => {
  if (duration) {
    let checkWorklog = worklogs.filter(worklog => {
      return moment(worklog.updated).isBetween(duration[0], duration[1]) ? true : false;
    });
    let changelength = worklogs.length - checkWorklog.length;

    return checkWorklog;
  } else return worklogs;
};

module.exports = {
  getCountIssueList,
  getIssueList,
  exportJiraQcdReport,
  exportOriginData,
  exportQCDToPDF,

  getAllProject,
  getAllStatusesProject,
  getTypeIssueListForChart,
  getUsersAssignable,
  getAllIssueTypes,
  getAllSprint,

  getQCD_KPI, 

  getUsersAssignableInProject
};
