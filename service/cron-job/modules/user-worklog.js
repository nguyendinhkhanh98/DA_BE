const CronJob = require("cron").CronJob;
const axios = require("axios");
const moment = require("moment");
const { sendEmail } = require("../../email");
const _ = require("lodash");
const knex = require("../../../config/database");
const Excel = require("exceljs");
const { pushSlack } = require("../../slack/index");
const table = require("markdown-table");
const username = process.env.JIRA_USERNAME;
const apiToken = process.env.API_TOKEN;
const JiraProjectRepository = require("../../../repository/postgres-repository/jira-project.repository");
const logger = require("../../../utils/logger.js")(__filename);

const sendMailUserWorklog = async () => {
  const job = new CronJob(process.env.TIME_CRON, sendWorklogTableToSlack);
  job.start();
};

const sendWorklogTableToSlack = async function (req, res) {
  logger.debug("Starting user worklog cron...");
  const listJiraProject = await JiraProjectRepository.getListJiraProject();
  let jiraProjectData;

  for (let index = 0; index < listJiraProject.length; index++) {
    const jiraProject = listJiraProject[index];
    logger.debug(`Waitting income data of project ${jiraProject.name}`);
    const jiraIssueData = await getIssueFromJiraWithURL(jiraProject.url);
    if (!jiraProjectData) jiraProjectData = jiraIssueData;
    else jiraProjectData.data.issues = jiraProjectData.data.issues.concat(jiraIssueData.data.issues);
  }
  logger.debug("DONE, prepare push to slack");

  // push slack
  const { dateHeader, rows } = await pushSlackUserWorklog(
    _.cloneDeep(jiraProjectData.data),
    jiraProjectData.startDate,
    jiraProjectData.endDate
  );
  // await pushSlackYesterdayUserWorklog(_.cloneDeep(arrow2.data));
  logger.debug("Cron-job: Push notification slack user worklog completed");

  //send excel
  // await sendEmailWorkLog(data, startDate, endDate, dateHeader, rows);
  if (req) res.json("Success!");
};

const sendEmailWorkLog = async (data, startDate, endDate, dateHeader, rows) => {
  // write to excel
  let workbookDetail = writeUserWorklogDetailToExcel(data);
  let workbookByDate = writeUserWorklogDateToExcel(dateHeader, rows);
  // send email
  const bufferDetail = await workbookDetail.xlsx.writeBuffer();
  const bufferDate = await workbookByDate.xlsx.writeBuffer();
  const emails = await knex.select("email").from("user");
  emails.forEach(item => {
    const emailData = {
      from: "jira.qcd@gmail.com",
      to: item.email,
      subject: "[JIRA QCD] Worklog User last week",
      attachments: [
        {
          filename: `${moment(startDate).format("YYYYMMDD")}_${moment(endDate).format(
            "YYYYMMDD"
          )}_Worklog_User_Detail.xlsx`,
          content: new Buffer.from(bufferDetail, "utf-8")
        },
        {
          filename: `${moment(startDate).format("YYYYMMDD")}_${moment(endDate).format(
            "YYYYMMDD"
          )}_Worklog_User_By_Date.xlsx`,
          content: new Buffer.from(bufferDate, "utf-8")
        }
      ]
    };
    sendEmail(emailData);
  });
};

const pushSlackUserWorklog = async (data, startDate, endDate) => {
  let mTable = [];
  let dateHeader = [];
  // header table
  data.issues.forEach(issue => {
    issue.fields.worklog.worklogs.forEach(worklog => {
      dateHeader.push(worklog.started.substring(0, 10).replace(/-/g, "/"));
    });
  });
  dateHeader = _.uniq(dateHeader);
  dateHeader.sort(function (a, b) {
    a = a.split("/").join("");
    b = b.split("/").join("");
    return a > b ? 1 : a < b ? -1 : 0;
  });
  dateHeader = dateHeader.slice(dateHeader.length - 4, dateHeader.length);
  let header = ["No", "Project", "Member"].concat(dateHeader);
  mTable.push(header);
  // body table
  let dataTable = [];
  data.issues.forEach(issue => {
    issue.fields.worklog.worklogs.forEach(worklog => {
      let started = worklog.started.substring(0, 10).replace(/-/g, "/");
      let worklogAuthor = worklog.author.displayName;
      let dataWorklog = _.find(
        dataTable,
        item => item.worklogAuthor == worklogAuthor && item.project == issue.fields.project.name
      );
      if (dataWorklog) {
        if (dataWorklog[started]) {
          dataWorklog[started] += worklog.timeSpentSeconds;
        } else {
          dataWorklog[started] = worklog.timeSpentSeconds;
        }
      } else {
        let el = {
          worklogAuthor: worklogAuthor,
          [started]: worklog.timeSpentSeconds,
          project: issue.fields.project.name
        };
        dataTable.push(el);
      }
    });
  });

  // map to rows of markdown-table
  let rows = [];
  dataTable.sort((r1, r2) => r1.worklogAuthor.localeCompare(r2.worklogAuthor));
  dataTable.forEach((item, index) => {
    let row = [];
    row.push(index + 1);
    row.push(item.project);
    row.push(item.worklogAuthor);
    for (let i = 0; i < dateHeader.length; i++) {
      if (item[dateHeader[i]]) {
        let timeSpentSeconds = item[dateHeader[i]];
        row.push(Math.round((timeSpentSeconds / 3600) * 100) / 100);
      } else {
        row.push("");
      }
    }
    rows.push(row);
  });
  mTable = mTable.concat(rows);

  let markdownTable = table(mTable, { padding: false });
  const payload = {
    blocks: [
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*User worklog from ${startDate} to ${endDate}*`
          }
        ]
      },
      {
        type: "divider"
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "```" + markdownTable + "```"
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `<${process.env.CLIENT_URL}/worklog-summary-by-user|Goto QCD for detail>`
        }
      }
    ]
  };
  await pushSlack(payload);
  return { dateHeader, rows };
};

const pushSlackYesterdayUserWorklog = async data => {
  let mTable = [];
  let dateHeader = [];
  // header table
  data.issues.forEach(issue => {
    issue.fields.worklog.worklogs.forEach(worklog => {
      dateHeader.push(worklog.started.substring(0, 10).replace(/-/g, "/"));
    });
  });
  dateHeader = _.uniq(dateHeader);
  dateHeader.sort(function (a, b) {
    a = a.split("/").join("");
    b = b.split("/").join("");
    return a > b ? 1 : a < b ? -1 : 0;
  });
  dateHeader = dateHeader.slice(dateHeader.length - 1, dateHeader.length);
  let header = ["No", "Project", "Member"].concat(dateHeader);
  mTable.push(header);
  // body table
  let dataTable = [];
  data.issues.forEach(issue => {
    if (issue.fields.worklog.total) {
      issue.fields.worklog.worklogs.forEach(worklog => {
        let started = worklog.started.substring(0, 10).replace(/-/g, "/");
        let worklogAuthor = worklog.author.displayName;

        if (moment(started, "YYYY/MM/DD").isSame(moment(dateHeader[0], "YYYY/MM/DD"))) {
          let comment = "";
          let showComment = "";
          let tempComment = [];
          try {
            comment = worklog.comment.content.map(item => {
              if (item.type == "paragraph") {
                let child = item.content.map(text => text.text);
                return child.filter(item => item);
              }
            });
            comment = comment.filter(item => item);
          } catch (error) {
            comment = [];
          }

          comment.map(item => (tempComment = tempComment.concat(item)));
          showComment = tempComment.join(" ").substring(0, 10);
          showComment = "Dong da build nhieu lan khong duoc";

          let el = {
            worklogAuthor: worklogAuthor,
            [started]: `${issue.key} ${worklog.timeSpent} ${showComment}`,
            project: issue.fields.project.name
          };
          dataTable.push(el);
        }
      });
    }
  });

  // map to rows of markdown-table
  let rows = [];
  dataTable = _.sortBy(dataTable, item => item.project);
  dataTable.forEach((item, index) => {
    let row = [];
    row.push(index + 1);
    row.push(item.project);
    row.push(item.worklogAuthor);
    if (item[dateHeader[0]]) {
      row.push(item[dateHeader[0]]);
      rows.push(row);
    }
  });
  rows = rows.slice(0, 55);
  mTable = mTable.concat(rows);

  let markdownTable = table(mTable, { padding: false });
  const payload = {
    blocks: [
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*User worklog day ${dateHeader[0]}*`
          }
        ]
      },
      {
        type: "divider"
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "```" + markdownTable + "```"
        }
      }
    ]
  };
  await pushSlack(payload);
  return;
};

const writeUserWorklogDateToExcel = (dateHeader, rows) => {
  let columns = [
    {
      name: "No",
      width: 5
    },
    {
      name: "Member",
      width: 20
    }
  ];
  const dateColumns = dateHeader.map(item => {
    return {
      name: item,
      width: 11
    };
  });
  columns = columns.concat(dateColumns);

  let workbook = new Excel.Workbook();

  // Set Workbook Properties
  workbook.creator = "Web";
  workbook.lastModifiedBy = "Web";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.lastPrinted = new Date();

  // Add a Worksheet
  let worksheet = workbook.addWorksheet("Worklog User By Date");

  worksheet.addTable({
    name: "UsersWorklogs",
    ref: "A1",
    headerRow: true,
    columns: columns,
    rows: rows
  });

  columns.forEach((column, index) => {
    // column width
    worksheet.getColumn(index + 1).width = column.width;
  });
  return workbook;
};

const writeUserWorklogDetailToExcel = data => {
  const columns = [
    {
      name: "No",
      width: 5
    },
    {
      name: "Author",
      width: 20
    },
    {
      name: "Issue",
      width: 11
    },
    {
      name: "Summary",
      width: 100
    },
    {
      name: "Spent time",
      width: 11
    }
  ];
  var rows = [];
  data.issues.forEach(issue => {
    issue.fields.worklog.worklogs.forEach(worklog => {
      let indexExistRow = _.findIndex(rows, obj => {
        return obj.issue === issue.key && worklog.author && worklog.author.displayName === obj.author;
      });
      if (indexExistRow > -1) {
        rows[indexExistRow].timeSpentSeconds += worklog.timeSpentSeconds;
      } else {
        rows.push({
          author: worklog.author.displayName,
          issue: issue.key,
          summary: issue.fields.summary,
          timeSpentSeconds: worklog.timeSpentSeconds
        });
      }
    });
  });
  rows = _.orderBy(rows, ["author", "issue"], ["asc", "desc"]);
  rows = rows.map((item, index) => {
    let row = [];
    row.push(index + 1);
    row.push(item.author);
    row.push({
      hyperlink: `https://arrowtech02.atlassian.net/browse/${item.issue}`,
      text: item.issue,
      tooltip: item.issue
    });
    row.push(item.summary);
    row.push(Math.round((item.timeSpentSeconds / 3600) * 100) / 100);
    return row;
  });

  let workbook = new Excel.Workbook();

  // Set Workbook Properties
  workbook.creator = "Web";
  workbook.lastModifiedBy = "Web";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.lastPrinted = new Date();

  // Add a Worksheet
  let worksheet = workbook.addWorksheet("Worklog User");

  worksheet.addTable({
    name: "UsersWorklogsTask",
    ref: "A1",
    headerRow: true,
    columns: columns,
    rows: rows
  });

  columns.forEach((column, index) => {
    // column width
    worksheet.getColumn(index + 1).width = column.width;
  });
  return workbook;
};

const getIssueWorklogs = async (jiraURL, issueIdOrKey, startDate) => {
  const startedAfter = moment(startDate).format("X");
  var options = {
    method: "GET",
    url:
      jiraURL +
      "/rest/api/3/issue/" +
      issueIdOrKey +
      "/worklog?startAt=0&maxResults=1000" +
      (startDate ? "&startedAfter=" + startedAfter : ""),
    auth: { username: username, password: apiToken },
    headers: {
      Accept: "application/json"
    }
  };
  const { data } = await axios(options);
  return data;
};

const searchIssuesJql = async (jiraURL, requestPayload) => {
  var options = {
    method: "POST",
    url: `${jiraURL}/rest/api/3/search`,
    auth: { username: username, password: apiToken },
    headers: {
      Accept: "application/json"
    },
    data: requestPayload
  };
  const { data } = await axios(options);
  return data;
};

const getIssueFromJiraWithURL = async jiraURL => {
  let startDate = moment().subtract(7, "days").format("YYYY-MM-DD");
  let endDate = moment().subtract(1, "days").format("YYYY-MM-DD");
  const jql = `worklogDate <= '${endDate}'`;
  var startAt = 0;
  var requestPayload = {
    jql: jql,
    maxResults: 100,
    fieldsByKeys: false,
    fields: ["worklog", "summary", "project"],
    startAt: startAt
  };
  var data = await searchIssuesJql(jiraURL, requestPayload);
  const { total } = data;
  if (total <= 100) {
    await Promise.all(
      data.issues.map(async issue => {
        const { worklog } = issue.fields;
        if (worklog.total > worklog.maxResults) {
          issue.fields.worklog = await getIssueWorklogs(jiraURL, issue.key, startDate);
        }
        issue.fields.worklog.worklogs = issue.fields.worklog.worklogs.filter(worklog => {
          let started = moment(worklog.started.substring(0, 10));
          return !moment(startDate).isAfter(started) && !moment(endDate).isBefore(started);
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
            issue.fields.worklog = await getIssueWorklogs(jiraURL, issue.key, startDate);
          }
          issue.fields.worklog.worklogs = issue.fields.worklog.worklogs.filter(worklog => {
            let started = moment(worklog.started.substring(0, 10));
            return !moment(startDate).isAfter(started) && !moment(endDate).isBefore(started);
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
              fields: ["worklog", "summary", "project"],
              startAt: startAt
            };
            let dataTemp = await searchIssuesJql(jiraURL, requestPayload);
            await Promise.all(
              dataTemp.issues.map(async (issue, index) => {
                const { worklog } = issue.fields;
                if (worklog.total > worklog.maxResults) {
                  issue.fields.worklog = await getIssueWorklogs(jiraURL, issue.key, startDate);
                }
                issue.fields.worklog.worklogs = issue.fields.worklog.worklogs.filter(worklog => {
                  let started = moment(worklog.started.substring(0, 10));
                  return !moment(startDate).isAfter(started) && !moment(endDate).isBefore(started);
                });
                issue.fields.worklog.total = issue.fields.worklog.worklogs.length;
              })
            );
            data.issues = data.issues.concat(dataTemp.issues);
          })
        )
    );
    data.issues = data.issues.filter(issue => issue.fields.worklog.worklogs.length);
    data.maxResults = data.issues.length;
    data.total = data.issues.length;
  }
  return { data, startDate, endDate };
};

module.exports = { sendMailUserWorklog, sendWorklogTableToSlack };
