const _ = require("lodash");
const moment = require("moment");
const JiraService = require("../../service/jira/index.js");
const IssueUtils = require("../../utils/issue.util.js");

const columns = [
  {
    slots: { title: "no_" },
    key: "no",
    scopedSlots: { customRender: "no" },
    align: "center",
    canModify: false,
    isHiden: false
  },
  {
    slots: { title: "user" },
    dataIndex: "worklogAuthor",
    key: "user",
    canModify: false,
    isHiden: false
  },
  {
    slots: { title: "project" },
    dataIndex: "project",
    key: "project",
    canModify: false,
    isHiden: false
  }
];

exports.getWorklogSheetData = async (payloads, shouldAddProjectKeysInTable) => {
  let durations = [];
  let worklogs = { issues: [] };
  for (let i = 0; i < payloads.length; i++) {
    let { filters, jiraUrl, duration } = payloads[i];
    let issues = await JiraService.getAllIssuesWithAllWorklog(jiraUrl, filters, duration);
    // console.log("issues", issues);
    let wls = await filterWorklogByUserAndDuration(jiraUrl, filters, issues, duration);
    // console.log("wls", wls);
    worklogs.issues = worklogs.issues.concat(wls.issues);
    durations = duration;
  }

  let authorsWithEmail = getAuthorsHavingJiraEmail(worklogs);
  console.log("authorsWithEmail", authorsWithEmail);
  let [dayColumns, dataTable] = handleWorklogData(
    worklogs,
    moment(durations[0], "YYYY/MM/DD"),
    moment(durations[1], "YYYY/MM/DD")
  );
  let { columns, rows } = handleDataForExportAllVersion2(dayColumns, dataTable, shouldAddProjectKeysInTable);
  let { sumarryColumns, sumarryRows, sumarryDuration } = handleDataSumarryForExportAllVersion2(columns, rows);
  let detailData = { columns, rows };
  console.log("detailData", detailData);
  let summaryData = { summaryColumns: sumarryColumns, summaryRows: sumarryRows, summaryDuration: sumarryDuration };
  console.log("summaryData", summaryData);
  return { detailData, summaryData, authorsWithEmail };
};

const filterWorklogByUserAndDuration = async (jiraUrl, filters, totalIssuesList, duration) => {
  let issues = await Promise.all(
    totalIssuesList.map(async issue => {
      const { worklog } = issue.fields;
      // if call worklog with api search issue, maxResults = 20
      // else if call by api get worklog, maxResults = 100
      if (worklog.total > worklog.maxResults) {
        issue.fields.worklog = await JiraRepository.getFullWorklog(jiraUrl, issue.key);
      }

      issue.fields.worklog.worklogs = IssueUtils.getWorklogInDuration(issue.fields.worklog.worklogs, duration);
      issue.fields.worklog.worklogs = IssueUtils.getWorklogInWorklogAuthor(
        issue.fields.worklog.worklogs,
        filters.worklogAuthor
      );

      issue.fields.worklog.total = issue.fields.worklog.worklogs.length;
      return issue;
    })
  );

  let data = {};
  data.issues = issues;
  data.startAt = 0;
  data.maxResults = data.issues.length;
  data.total = data.issues.length;

  return data;
};

const handleWorklogData = (dataSrc, startDate, endDate) => {
  let listDate = getListDateInDuration("YYYY/MM/DD", startDate, endDate);
  let dayColumns = getListColumn(columns, listDate);
  let dataTable = getDataTable(dayColumns, dataSrc, listDate);
  return [dayColumns, dataTable];
};

const getListDateInDuration = (dateFormat, startDate, endDate) => {
  let listDate = [];
  while (startDate <= endDate) {
    listDate.push(startDate.format(dateFormat));
    startDate = startDate.add(1, "day");
  }
  return listDate;
};

const getListColumn = (columns, listDate) => {
  let dayColumns = [];
  listDate.forEach(date => {
    dayColumns.push({
      title: date,
      dataIndex: date,
      key: date,
      align: "center",
      scopedSlots: { customRender: "timeSpentSeconds" },
      customTitle: true,
      isHiden: true,
      canModify: true
    });
  });

  dayColumns = columns.concat(dayColumns);
  // console.log("dayColumns", dayColumns);
  return dayColumns;
};

const getDataTable = (dayColumns, dataSrc, listDate) => {
  let dataTable = [];

  dataSrc.issues.forEach(issue => {
    issue.fields.worklog.worklogs.forEach(worklog => {
      let started = worklog.started.substring(0, 10).replace(/-/g, "/");

      // Find in list full column, mark it as column have value
      let itemColumn = dayColumns.find(item => item.title == started);
      if (itemColumn) {
        itemColumn.isHiden = false;
        itemColumn.canModify = false;
      }

      // data table
      let worklogAuthor = worklog.author.displayName;
      let authorItem = dataTable.find(
        item => item.worklogAuthor == worklogAuthor && item.project == issue.fields.project.name
      );

      if (authorItem) {
        if (authorItem[started]) {
          authorItem[started].value += worklog.timeSpentSeconds;
          authorItem[started].worklogs.push({ ...worklog, issueKey: issue.key });
        } else {
          authorItem[started] = {
            value: worklog.timeSpentSeconds,
            worklogs: [{ ...worklog, issueKey: issue.key }],
            dayTrigger: started
          };
        }
      } else {
        let el = {
          worklogAuthor: worklogAuthor,
          [started]: {
            value: worklog.timeSpentSeconds,
            worklogs: [{ ...worklog, issueKey: issue.key }],
            dayTrigger: started
          },
          project: issue.fields.project.name,
          key: issue.fields.project.key,
          email: worklog.author.emailAddress
        };
        dataTable.push(el);
      }
    });
  });

  dataTable.sort(function (a, b) {
    return a.worklogAuthor.localeCompare(b.worklogAuthor);
  });
  // console.log("dataTable", dataTable);
  dataTable = fillFullDataForDataSource(dataTable, listDate);
  return dataTable;
};

const fillFullDataForDataSource = (dataSource, listDate) => {
  dataSource.forEach(row => {
    listDate.forEach(date => {
      if (!row[date]) {
        row[date] = {
          dayTrigger: date
        };
      }
    });
  });
  // console.log("dataSource", dataSource);
  return dataSource;
};

const handleDataForExportAllVersion2 = (dayColumns, dataSource, shouldAddProjectKeysInTable) => {
  // handler list day to columns for first table
  let columns = [
    { name: "No", width: 5 },
    { name: "User", width: 20 },
    { name: "Project", width: 20 },
    { name: "Project Key", width: 20 },
    { name: "Email", width: 20 }
  ];
  if (!shouldAddProjectKeysInTable) {
    columns.pop();
    columns.pop();
  }
  for (let i = 3; i < dayColumns.length; i++) {
    let date = dayColumns[i].title;
    columns.push({ name: date, width: 11 });
  }
  columns.push({ name: "Total", width: 11 });

  // Handler data for first table
  let rows = [];
  dataSource.forEach((item, index) => {
    let row = [];
    row.push(index + 1);
    row.push(item.worklogAuthor);
    row.push(item.project);
    if (shouldAddProjectKeysInTable) {
      row.push(item.key);
      row.push(item.email);
    }
    let total = 0;
    for (let i = shouldAddProjectKeysInTable ? 5 : 3; i < columns.length; i++) {
      if (i === columns.length - 1) {
        row.push(Math.round((total / 3600) * 100) / 100);
      } else {
        let itemValue = item[columns[i].name];
        if (itemValue && itemValue.value) {
          let timeSpentSeconds = itemValue.value;
          row.push(Math.round((timeSpentSeconds / 3600) * 100) / 100);
          total += timeSpentSeconds;
        } else {
          row.push("");
        }
      }
    }
    rows.push(row);
  });
  let lastRow = ["", "Total", ""];
  let totalSum = 0;
  for (let i = shouldAddProjectKeysInTable ? 5 : 3; i < rows[0]?.length - 1; i++) {
    let totalDay = 0;
    for (const row of rows) {
      if (row[i]) {
        totalDay += row[i];
      }
    }
    lastRow.push(totalDay);
    totalSum += totalDay;
  }
  lastRow.push(totalSum);
  rows.push(lastRow);

  return { columns, rows };
};

const handleDataSumarryForExportAllVersion2 = (columns, rows) => {
  let resultRows = [];
  let sumarryColumns = [
    {
      name: "No",
      width: 5
    },
    {
      name: "User",
      width: 5
    },
    {
      name: "Man-Hour",
      width: 5
    },
    {
      name: "Man-Day",
      width: 5
    },
    {
      name: "Man-Month",
      width: 5
    }
  ];
  let duration = getDurationFromOriginColumns(columns);
  let listUsers = getListUserFromOriginRows(rows);
  let maxLengthOneRow = rows[0].length;

  listUsers.forEach((user, userIndex) => {
    let listDataUsers = rows.filter(row => row[1] == user);
    let arrayTotalTime = listDataUsers.map(data => data[maxLengthOneRow - 1]);
    let totalTimeByUser = arrayTotalTime.reduce((sum, value) => (sum += value), 0);
    let newRow = [];

    newRow.push(userIndex + 1);
    newRow.push(user);
    newRow.push(+totalTimeByUser.toFixed(2));
    newRow.push(getTotalTimeByDay(totalTimeByUser));
    newRow.push(getTotalTimeByMonth(totalTimeByUser));
    resultRows.push(newRow);
  });

  let lastRow = [];
  lastRow.push("");
  lastRow.push("Total");
  lastRow.push(getTotalTimeFromTotalRowByIndex(resultRows, 2));
  lastRow.push(getTotalTimeFromTotalRowByIndex(resultRows, 3));
  lastRow.push(getTotalTimeFromTotalRowByIndex(resultRows, 4));
  resultRows.push(lastRow);

  return { sumarryRows: resultRows, sumarryColumns, sumarryDuration: duration };
};

function getDurationFromOriginColumns(columns) {
  if (columns.length <= 3) return ["", ""];
  return [columns[3], columns[columns.length - 2]].map(item => item.name);
}

function getListUserFromOriginRows(rows) {
  let listUsers = rows.map(item => item[1]);
  listUsers.pop();
  listUsers = _.uniq(listUsers);
  return listUsers;
}

function getTotalTimeByDay(totalHour) {
  if (!totalHour) return "";

  return +(totalHour / 8).toFixed(2);
}

function getTotalTimeByMonth(totalHour) {
  if (!totalHour) return "";

  let totalHourOneMonth = 8 * 20;

  return +(totalHour / totalHourOneMonth).toFixed(2);
}

function getTotalTimeFromTotalRowByIndex(rows, index) {
  return rows.reduce((sum, item) => {
    return (sum += item[index]);
  }, 0);
}

const getAuthorsHavingJiraEmail = worklogs => {
  let authors = [];
  worklogs.issues.forEach(issue => {
    issue.fields.worklog.worklogs.forEach(wl => {
      if (wl.author.emailAddress && authors.findIndex(a => a.displayName == wl.author.displayName) == -1)
        authors.push({ emailAddress: wl.author.emailAddress, displayName: wl.author.displayName });
    });
  });
  return authors;
};
