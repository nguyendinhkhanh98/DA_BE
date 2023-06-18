const BUG_TYPE = "Bug";
const DONE_INTERNAL_STATUS = ["Resolved", "UAT in progress", "Waiting UAT"];
const ISSUE_CONST = require("./const");
const _ = require("lodash");
const moment = require("moment");
const logger = require("../utils/logger.js")(__filename);
FORMAT_DATE = "YYYY-MM-DD";

const getTotalTimeSpentAllIssues = function (issuesList) {
  return (
    issuesList.reduce((sum, item) => {
      return (sum += item.fields.timetracking.timeSpentSeconds);
    }, 0) / 3600
  );
};
const countTimeInWorklog = function (worklogs) {
  return worklogs.reduce((sum, item) => {
    let time = item.timeSpentSeconds ? item.timeSpentSeconds : 0;
    return (sum += time);
  }, 0);
};
const getTotalTimeSpentAllIssuesInDuration = function (issuesList, duration) {
  return +(
    issuesList.reduce((sum, item) => {
      return (sum += countTimeInWorklog(item.fields.worklog.worklogs));
    }, 0) / 3600
  ).toFixed(2);
};

const totalTimeSpentForBug = function (issuesList) {
  let bugs = issuesList.filter(item => item.fields.issuetype.name == BUG_TYPE);
  return +(
    bugs.reduce((sum, bug) => {
      let time = sumOriginTimeSpentByWorklog(bug);
      return (sum += time);
    }, 0) / 3600
  ).toFixed(2);
};

const totalTimeSpentForDegradation = function (issuesList) {
  let listDegrationIssue = getListIssueDegrate(issuesList);
  return +(
    listDegrationIssue.reduce((sum, bug) => {
      let time = sumOriginTimeSpentByWorklog(bug);
      return (sum += time);
    }, 0) / 3600
  ).toFixed(2);
};

const getEstimatedHour = function (issuesList) {
  return +(
    issuesList.reduce((sum, item) => {
      let estimate = item.fields.timetracking.originalEstimateSeconds
        ? item.fields.timetracking.originalEstimateSeconds
        : 0;
      return (sum += estimate);
    }, 0) / 3600
  ).toFixed(2);
};

const getIssuesBehindSchedule = function (issuesList) {
  let listIssuesBehindSchedule = issuesList.filter(issue => issueIsBehindSchedule(issue));
  return {
    count: listIssuesBehindSchedule.length,
    issues: listIssuesBehindSchedule
  };
};

const issueIsBehindSchedule = issue => {
  let actualFinishDate = getActualFinishDate(issue);
  //Find Answer duedate
  let answerDueDate = issue.fields.duedate ? moment(issue.fields.duedate).format(FORMAT_DATE) : "";

  return moment(actualFinishDate, FORMAT_DATE).isAfter(moment(answerDueDate, FORMAT_DATE));
};

const getWorklogInDuration = (worklogs, duration) => {
  if (duration) {
    let checkWorklog = worklogs.filter(worklog => {
      try {
        let updated = moment(worklog.started, FORMAT_DATE).unix();
        let momentStartDate = moment(duration[0], FORMAT_DATE).unix();
        let momentEndDate = moment(duration[1], FORMAT_DATE).unix();
        let isBetween = updated >= momentStartDate && updated <= momentEndDate;

        return isBetween ? true : false;
      } catch (e) {
        logger.error(e);
        return false;
      }
    });
    return checkWorklog;
  } else return worklogs;
};

function getActualFinishDate(issue) {
  if (!issue.changelog) return "";
  let changeLogs = issue.changelog.histories;
  if (!changeLogs) return "";
  let actualFinishDate = "";
  //Find actualFinishDate
  const waitingUATS = changeLogs.filter(element => {
    return _.find(element.items, { toString: "Waiting UAT" });
  });
  const resolveds = changeLogs.filter(element => {
    return _.find(element.items, { toString: "Resolved" });
  });
  let status = issue.fields.status.name;

  if (waitingUATS && waitingUATS.length > 0) {
    if (status == "Waiting UAT" || status == "UAT in progress" || status == "Resolved") {
      actualFinishDate = moment(waitingUATS[waitingUATS.length - 1].created).format(FORMAT_DATE);
    }
  } else if (resolveds && resolveds.length > 0) {
    if (status == "Resolved") {
      actualFinishDate = moment(resolveds[resolveds.length - 1].created).format(FORMAT_DATE);
    }
  } else {
    actualFinishDate = "";
  }

  return actualFinishDate;
}

const sumOriginTimeSpentByWorklog = issue => {
  let worklogs = issue.fields.worklog.worklogs;
  return countTimeInWorklog(worklogs);
};

const getDateLastUpdatedInDuration = issue => {
  let worklogs = issue.fields.worklog.worklogs;
  if (worklogs && worklogs.length > 0) {
    return moment(worklogs[worklogs.length - 1].updated).format(FORMAT_DATE);
  }
  return "";
};

const getSummaryActualFinishDate = issue => {
  let listFinishDate = [];
  let lastDate = getActualFinishDate(issue);
  listFinishDate.push(lastDate);
  let subTasks = issue.fields.subtasks;
  subTasks.forEach(x => {
    listFinishDate.push(getActualFinishDate(x));
  });
  if (listFinishDate && listFinishDate.length > 0) {
    for (let i = 1; i < listFinishDate.length; i++) {
      if (moment(lastDate, FORMAT_DATE).isBefore(moment(listFinishDate[i], FORMAT_DATE))) {
        lastDate = listFinishDate[i];
      }
    }
  }
  return lastDate;
};

const getSummaryProgress = (duadate, finishDate) => {
  let momentDuadate = moment(duadate, FORMAT_DATE);
  let momentFinishDate = moment(finishDate, FORMAT_DATE);
  if (momentDuadate.isBefore(momentFinishDate)) return ISSUE_CONST.PROGRESS.BEHIND_SCHEDULE.value;
  if (momentDuadate.isAfter(momentFinishDate)) return ISSUE_CONST.PROGRESS.AHEAD_OF_SCHEDULE.value;

  return ISSUE_CONST.PROGRESS.ON_SCHEDULE.value;
};

const sumSummaryTimeSpentByWorklog = issue => {
  let total = 0;
  let subTasks = issue.fields.subtasks;
  if (subTasks && subTasks.length > 0) {
    return subTasks.reduce((sum, item) => (sum += sumOriginTimeSpentByWorklog(item)), total);
  }
  return total;
};
const sumEstimteTimeSpentBy = issue => {
  let total = 0;
  let subTasks = issue.fields.subtasks;
  if (subTasks && subTasks.length > 0) {
    return total + _.sumBy(subTasks, item => item.fields.timetracking.originalEstimateSeconds);
  }
  return total;
};
const getWorklogInWorklogAuthor = (worklogs, worklogAuthor) => {
  if (worklogAuthor && worklogAuthor.length) {
    let filterWorklogs = worklogs.filter(worklog => {
      return worklogAuthor.indexOf(worklog.author.displayName) > -1;
    });

    return filterWorklogs;
  } else return worklogs;
};

const getListIssueDegrate = issues => {
  return issues.filter(issue => issue.fields.customfield_11130 && issue.fields.customfield_11130.value == "Yes");
};

const getEstimatedSecondTabHour = function (issuesList, duration) {
  return +(
    issuesList.reduce((sum, item) => {
      let timeSpent = countTimeInWorklog(item.fields.worklog.worklogs);
      let totalTimeSpent = item.fields.timetracking.timeSpentSeconds;
      let estimate = item.fields.timetracking.originalEstimateSeconds
        ? item.fields.timetracking.originalEstimateSeconds
        : 0;
      if (totalTimeSpent == 0) return sum;
      if (totalTimeSpent < estimate) {
        let status = item.fields.status.name;
        if (DONE_INTERNAL_STATUS.includes(status)) return (sum += estimate);
        else return (sum += timeSpent);
      }
      return (sum += (timeSpent / totalTimeSpent) * estimate);
    }, 0) / 3600
  ).toFixed(2);
};

const getParentTask = data => {
  if (data.fields.issuetype.subtask)
    return { key: data.fields.parent.key, name: data.fields.parent.fields.issuetype.name };
  else {
    if (data.fields.issuetype.name == "Task") {
      if (!data.fields.issuelinks.length) return { key: data.key, name: data.fields.issuetype.name };
      for (let i = 0; i < data.fields.issuelinks.length; i++) {
        const element = data.fields.issuelinks[i];
        if (
          element.inwardIssue &&
          ["Story", "New Feature", "Bug", "Improvement", "Q&A"].includes(element.inwardIssue.fields.issuetype.name)
        )
          return { key: element.inwardIssue.key, name: element.inwardIssue.fields.issuetype.name };
        if (
          element.outwardIssue &&
          ["Story", "New Feature", "Bug", "Improvement", "Q&A"].includes(element.outwardIssue.fields.issuetype.name)
        )
          return { key: element.outwardIssue.key, name: element.outwardIssue.fields.issuetype.name };
      }
    }
    return { key: data.key, name: data.fields.issuetype.name };
  }
};

module.exports = {
  getTotalTimeSpentAllIssues,
  totalTimeSpentForBug,
  totalTimeSpentForDegradation,
  getEstimatedHour,
  getIssuesBehindSchedule,
  getTotalTimeSpentAllIssuesInDuration,
  getWorklogInDuration,
  getActualFinishDate,
  sumOriginTimeSpentByWorklog,
  sumSummaryTimeSpentByWorklog,
  sumEstimteTimeSpentBy,
  getDateLastUpdatedInDuration,
  getSummaryProgress,
  getSummaryActualFinishDate,
  countTimeInWorklog,
  issueIsBehindSchedule,
  getWorklogInWorklogAuthor,
  getListIssueDegrate,
  getEstimatedSecondTabHour,
  getParentTask
};
