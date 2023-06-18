const axios = require("axios");
const moment = require("moment");
const _ = require("lodash");
const Excel = require("exceljs");
const CONSTANT = require("../../utils/const");
const username = process.env.JIRA_USERNAME;
const apiToken = process.env.API_TOKEN;

const getTimeSheet = async (req, res) => {
  const { filters, page, limit } = req.body;
  const jqlString = convertToJqlString(filters);
  const bodyData = {
    jql: jqlString,
    maxResults: limit,
    fieldsByKeys: false,
    fields: ["issuetype", "parent", "timetracking", "summary", "priority"],
    startAt: (page - 1) * limit
  };
  var options = {
    method: "POST",
    url: `${req.user.jiraUrl}/rest/api/3/search`,
    auth: { username: username, password: apiToken },
    headers: {
      Accept: "application/json"
    },
    data: bodyData
  };
  const { data } = await axios(options);
  return res.json(data);
};

const exportTimeSheet = async (req, res) => {
  const { filters } = req.body;
  const issues = await getIssueList(filters, req);
  // create xlsx
  const startDate = moment(filters.startDate).format("YYYYMMDD");
  const endDate = moment(filters.endDate).format("YYYYMMDD");
  var workbook = writeIssueToExcel(issues);

  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
  res.setHeader("Content-Disposition", `attachment; filename=Worklog_by_issue_${startDate}_${endDate}.xlsx`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  workbook.xlsx.write(res).then(function () {
    res.end();
  });
};

const exportTimeSheetByParent = async (req, res) => {
  const { filters } = req.body;
  const issues = await getIssueList(filters, req);
  // create xlsx
  const startDate = moment(filters.startDate).format("YYYYMMDD");
  const endDate = moment(filters.endDate).format("YYYYMMDD");
  var workbook = writeIssueParentToExcel(issues);

  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
  res.setHeader("Content-Disposition", `attachment; filename=Worklog_by_issue_parent_${startDate}_${endDate}.xlsx`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  workbook.xlsx.write(res).then(function () {
    res.end();
  });
};

const getIssueList = async (filters, req) => {
  const jqlString = convertToJqlString(filters);
  const bodyData = {
    jql: jqlString,
    maxResults: 100,
    fieldsByKeys: false,
    fields: ["issuetype", "parent", "timetracking", "summary", "priority"],
    startAt: 0
  };
  var options = {
    method: "POST",
    url: `${req.user.jiraUrl}/rest/api/3/search`,
    auth: { username: username, password: apiToken },
    headers: {
      Accept: "application/json"
    },
    data: bodyData
  };
  const { data } = await axios(options);
  if (data.total > 100) {
    const countApi = Math.ceil(data.total / 100) - 1;
    var p = [];
    for (let i = 0; i < countApi; i++) {
      let bodyData = {
        jql: jqlString,
        maxResults: 100,
        fieldsByKeys: false,
        fields: ["issuetype", "parent", "timetracking", "summary", "priority"],
        startAt: (i + 1) * 100
      };
      let options = {
        method: "POST",
        url: `${req.user.jiraUrl}/rest/api/3/search`,
        auth: { username: username, password: apiToken },
        headers: {
          Accept: "application/json"
        },
        data: bodyData
      };
      p[i] = axios(options);
    }
    const datas = await Promise.all(p);
    var issues = [];
    issues = issues.concat(data.issues);
    datas.map(data => {
      issues = issues.concat(data.data.issues);
    });
    return issues;
  } else {
    return data.issues;
  }
};

const convertToJqlString = filters => {
  var filtersJql = [];
  Object.entries(filters).map(([key, val]) => {
    if (key !== "startDate" && key !== "endDate")
      if (val.length) {
        var jqlVal = "";
        val.forEach((item, index) => {
          if (index === 0) {
            jqlVal += `"${item}"`;
          } else {
            jqlVal += `,"${item}"`;
          }
        });
        filtersJql.push(`${key} in (${jqlVal})`);
      }
  });
  return (
    filtersJql.join(" AND ") +
    ` AND worklogDate >= "${filters.startDate}" AND worklogDate <= "${filters.endDate}" order by created DESC`
  );
};

const writeIssueParentToExcel = issues => {
  let parentIssue = issues.filter(issue => !issue.fields.parent);
  issues.forEach(issue => {
    if (issue.fields.parent) {
      let parentIndex = _.findIndex(parentIssue, p => p.key === issue.fields.parent.key);
      if (parentIndex > -1) {
        parentIssue[parentIndex].fields.timetracking.timeSpentSeconds += issue.fields.timetracking.timeSpentSeconds;
      }
    }
  });
  var rows = [];
  for (let i = 0; i < parentIssue.length; i++) {
    let issue = parentIssue[i];
    const { fields } = issue;
    if (!fields.parent) {
      let row = [
        i + 1,
        fields.issuetype.name,
        fields.parent ? fields.parent.key : "",
        issue.key,
        fields.summary,
        fields.priority.name,
        Math.round((fields.timetracking.timeSpentSeconds / 3600) * 100) / 100
      ];
      rows.push(row);
    }
  }
  var workbook = new Excel.Workbook();
  workbook.creator = "anhbui";
  workbook.lastModifiedBy = "anhbui";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.lastPrinted = new Date();
  workbook.properties.date1904 = true;

  var worksheet = workbook.addWorksheet("Time sheet task");
  let columns = [
    {
      name: "No",
      width: 5
    },
    {
      name: "Issue Type",
      width: 20
    },
    {
      name: "Parent",
      width: 10
    },
    {
      name: "Key",
      width: 10
    },
    {
      name: "Summary",
      width: 120
    },
    {
      name: "Priority",
      width: 10
    },
    {
      name: "Total (hours)",
      width: 15
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
    // column width
    worksheet.getColumn(index + 1).width = column.width;
  });
  return workbook;
};

const writeIssueToExcel = issues => {
  var rows = [];
  for (let i = 0; i < issues.length; i++) {
    let issue = issues[i];
    const { fields } = issue;
    let row = [
      i + 1,
      fields.issuetype.name,
      fields.parent ? fields.parent.key : "",
      issue.key,
      fields.summary,
      fields.priority.name,
      Math.round((fields.timetracking.timeSpentSeconds / 3600) * 100) / 100
    ];
    rows.push(row);
  }
  var workbook = new Excel.Workbook();
  workbook.creator = "anhbui";
  workbook.lastModifiedBy = "anhbui";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.lastPrinted = new Date();
  workbook.properties.date1904 = true;

  var worksheet = workbook.addWorksheet("Time sheet task");
  let columns = [
    {
      name: "No",
      width: 5
    },
    {
      name: "Issue Type",
      width: 20
    },
    {
      name: "Parent",
      width: 10
    },
    {
      name: "Key",
      width: 10
    },
    {
      name: "Summary",
      width: 120
    },
    {
      name: "Priority",
      width: 10
    },
    {
      name: "Total (hours)",
      width: 15
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
    // column width
    worksheet.getColumn(index + 1).width = column.width;
  });
  return workbook;
};

module.exports = {
  getTimeSheet,
  exportTimeSheet,
  exportTimeSheetByParent
};
