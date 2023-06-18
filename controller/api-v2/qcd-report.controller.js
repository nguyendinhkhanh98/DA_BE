const _ = require("lodash");
const moment = require("moment");
const Formatter = require("response-format");
const logger = require("../../utils/logger.js")(__filename);
const Bottleneck = require("bottleneck/es5");
const JiraRepository = require("../../repository/jira-repository/issue.jira.repository.js");
const ProjectRepository = require("../../repository/jira-repository/project.jira.repository.js");
const ProjectCostRepository = require("../../repository/postgres-repository/project-cost.repository");
const JiraService = require("../../service/jira/index.js");
const QcdKpi = require("../../entity/qcd-kpi.entity.js");
const IssueUtils = require("../../utils/issue.util.js");
const { QcdOriginExport, QcdSummaryExport } = require("../../entity/issue-export.entity");
const { writeInvoiceSheetsToExcel } = require("../../service/excel/index.js");
const { getWorklogSheetData } = require("../../service/worklog/index.js");
const limiter = new Bottleneck({
  maxConcurrent: 2,
  minTime: 10
});

const getQcdKpiReport = async (req, res) => {
  const { filters, progress, duration, jiraUrl } = req.body;
  let issuesList = await getIssuesFullChangelogWorklog(jiraUrl, filters, duration);

  // Need filter changelog and worklog in duration ****
  let { quality, cost, delivery, costTabHour } = new QcdKpi(issuesList);
  // let qcd = await convertIssuesListToQCD(issuesList.issues);
  return res.json({ quality, cost, delivery, costTabHour });
};

const getQcdOriginReport = async (req, res) => {
  const { filters, progress, duration, jiraUrl } = req.body;
  let issuesList = await getIssuesFullChangelogWorklog(jiraUrl, filters, duration);
  let issueOriginList = issuesList.map(x => {
    return new QcdOriginExport().getQcdOrigin(x);
  });
  let workbook = new QcdOriginExport().excelExporter(issueOriginList);
  const now = moment().format("YYYYMMDD");
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
  res.setHeader("Content-Disposition", `attachment; filename=OriginalData_${filters.project.join("_")}_${now}.xlsx`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  workbook.xlsx.write(res).then(function () {
    res.end();
  });
};
const getQcdSummaryReport = async (req, res) => {
  const { filters, progress, duration, jiraUrl } = req.body;
  let issueLists = await getIssueSummaryList(jiraUrl, filters, duration);
  let issueSummaryList = issueLists[0];
  let workbook = new QcdSummaryExport().excelExporter(issueSummaryList);
  const now = moment().format("YYYYMMDD");
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
  res.setHeader("Content-Disposition", `attachment; filename=QCDData_${filters.project.join("_")}_${now}.xlsx`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  workbook.xlsx.write(res).then(function () {
    res.end();
  });
};

let getIssueSummaryList = async (jiraUrl, filters, duration) => {
  let issuesList = await getIssuesFullChangelogWorklog(jiraUrl, filters, duration);
  issuesList.forEach(issue => {
    let parrent = IssueUtils.getParentTask(issue);
    issue.parrent_key = parrent.key;
  });
  let parrentMap = _.chain(issuesList)
    .groupBy("parrent_key")
    .map((value, key) => ({
      key: key,
      subTasks: value
    }))
    .value();
  let parrenkeys = parrentMap.map(x => x.key);
  let parrents = issuesList.filter(x => parrenkeys.indexOf(x.key) > -1);
  let parrentsMapMissing = parrentMap.filter(x => !parrents.find(y => y.key == x.key));
  if (parrentsMapMissing && parrentsMapMissing.length > 0) {
    let parrentsMissing = await JiraRepository.getAllIssueIn(
      jiraUrl,
      filters.project,
      parrentsMapMissing.map(x => x.key)
    );
    parrentsMissing.forEach(parrent => {
      let subTasks = parrentMap.find(x => x.key == parrent.key).subTasks;
      parrent.fields.subtasks = subTasks;
      parrents.push(parrent);
    });
  }
  parrents.forEach(parrent => {
    let subTasks = parrentMap.find(x => x.key == parrent.key).subTasks;
    parrent.fields.subtasks = subTasks;
  });
  let issueSummaryList = parrents.map(x => {
    return new QcdSummaryExport().getQcdSumarry(x);
  });

  return [issueSummaryList, issuesList];
};

const getListBugDetail = async (req, res) => {
  const { filters, progress, duration, jiraUrl } = req.body;
  let data = await getAllIssueBugInDuration(jiraUrl, filters, duration);

  res.json(Formatter.success(null, data));
};

const getListIssueOverEstimate = async (req, res) => {
  const { filters, progress, duration, jiraUrl } = req.body;
  let data = await getAllIssuesOverEstimateInDuration(jiraUrl, filters, duration);
  res.json(Formatter.success(null, data));
};

const getListIssueOverDueDate = async (req, res) => {
  const { filters, progress, duration, jiraUrl } = req.body;
  let data = await getAllIssuesOverDueDateInDuration(jiraUrl, filters, duration);
  // let data = [{ key: "SA-1041", summary: "sumarry", jiraLink: "https://www.antdv.com/components/locale-provider/" }];

  res.json(Formatter.success(null, data));
};

const getListIssueHasDegrate = async (req, res) => {
  const { filters, progress, duration, jiraUrl } = req.body;
  let data = await getAllIssuesHasDegrate(jiraUrl, filters, duration);
  // let data = [{ key: "SA-1041", summary: "sumarry", jiraLink: "https://www.antdv.com/components/locale-provider/" }];

  res.json(Formatter.success(null, data));
};

const getIssuesKpiReport = function (issues, issuesChangelogs, issuesWorklogs, duration) {
  return issues.map(issue => {
    if (issuesChangelogs && issuesChangelogs.length) {
      let issuesChangelog = issuesChangelogs.find(x => x.key == issue.key);
      if (issuesChangelog) {
        issue.changelog.histories = issuesChangelog.changelog;
      }
    }

    if (issuesWorklogs && issuesWorklogs.length) {
      let issuesWorklog = issuesWorklogs.find(x => x.key == issue.key);
      if (issuesWorklog) {
        issue.fields.worklog = issuesWorklog.worklog;
      }
    }

    issue.fields.worklog.worklogs = IssueUtils.getWorklogInDuration(issue.fields.worklog.worklogs, duration);
    return issue;
  });
};
const extractNeededInfoForExportKpi = function (issues) {
  let issues_key_full_changelog = getIssueKeyNeedMoreChangeLog(issues);
  logger.debug("Issue need get Change Log: ", issues_key_full_changelog.length, issues_key_full_changelog);
  let issues_key_full_worklog = getIssueKeyNeedMoreWorkLog(issues);
  logger.debug("Issue need get Work Log: ", issues_key_full_worklog.length, issues_key_full_worklog);
  return { issues_key_full_changelog, issues_key_full_worklog };
};

function getParrentIssueListIn(issuesList) {
  let issueParrentList = [];
  issuesList.forEach(issue => {
    let newIssue = _.cloneDeep(issue);
    let subTasks = issue.fields.subtasks;
    if (["Story", "New Feature", "Bug", "Improvement", "Q&A"].includes(issue.fields.issuetype.name))
      issueParrentList.push(newIssue);
    if (subTasks && subTasks.length > 0) {
      let subTaskLength = subTasks.length;
      let newSubTask = issuesList.filter(x => {
        for (let i = 0; i < subTaskLength; i++) {
          if (x.key == subTasks[i].key) return true;
        }
        return false;
      });
      newIssue.fields.subtasks = newSubTask;
      issueParrentList.push(newIssue);
    }
  });

  return issueParrentList;
}

async function getIssuesFullChangelogWorklog(jiraUrl, filters, duration) {
  let issues = await JiraRepository.getAllIssue(jiraUrl, filters, duration);
  logger.debug("Total Issue: ", issues.length);
  let neededInfo = extractNeededInfoForExportKpi(issues);

  let more_issues_full_changelog = await limiter.schedule(() => {
    return Promise.all(
      neededInfo.issues_key_full_changelog.map(async issue_key => {
        return {
          key: issue_key,
          changelog: await JiraRepository.getFullChangelog(jiraUrl, issue_key)
        };
      })
    );
  });

  let more_issues_full_worklog = await limiter.schedule(() => {
    return Promise.all(
      neededInfo.issues_key_full_worklog.map(async issue_key => {
        return {
          key: issue_key,
          worklog: await JiraRepository.getFullWorklog(jiraUrl, issue_key)
        };
      })
    );
  });

  issuesFullData = getIssuesKpiReport(issues, more_issues_full_changelog, more_issues_full_worklog, duration);
  return issuesFullData;
}

function getIssueKeyNeedMoreChangeLog(issues) {
  return issues.filter(issue => issue.changelog.total > 100).map(item => item.key);
}

function getIssueKeyNeedMoreWorkLog(issues) {
  // if call worklog with api search issue, maxResults = 20
  // else if call by api get worklog, maxResults = 100
  return issues.filter(issue => issue.fields.worklog.total > issue.fields.worklog.maxResults).map(item => item.key);
}

const getJiraLink = (self, issueKey) => {
  let regex = /rest\S+/g;
  let linkToJira = self.replace(regex, `browse/${issueKey}`);
  return linkToJira;
};

const getListUserInWorklog = worklogs => {
  // Get raw user in worklog
  let listUser = worklogs.map(worklog => {
    return {
      avatarUrl: worklog.author.avatarUrls["16x16"],
      displayName: worklog.author.displayName
    };
  });

  // Uniq list user
  listUser = _.uniqBy(listUser, item => item.displayName);
  return listUser;
};

const convertBugIssueList = issues => {
  return issues.map(issue => {
    let data = {};
    data.key = issue.key;
    data.summary = issue.fields.summary;
    data.jiraLink = getJiraLink(issue.self, issue.key);
    data.userInWorklog = getListUserInWorklog(issue.fields.worklog.worklogs);
    return data;
  });
};

const convertToListIssuesOverEstimate = (issues, duration) => {
  let data = issues.filter(issue => {
    try {
      let worklogInDuration = IssueUtils.getWorklogInDuration(issue.fields.worklog.worklogs, duration);
      let timeSpentSeconds = IssueUtils.countTimeInWorklog(worklogInDuration);
      let originalEstimateSeconds = issue.fields.timetracking.originalEstimateSeconds;
      issue.cost = +(((timeSpentSeconds - originalEstimateSeconds) / originalEstimateSeconds) * 100).toFixed(2);

      if (timeSpentSeconds && originalEstimateSeconds) {
        return timeSpentSeconds > originalEstimateSeconds ? true : false;
      } else return false;
    } catch (error) {
      logger.debug(error);
      return false;
    }
  });

  return data.map(issue => {
    let temp = {};
    temp.key = issue.key;
    temp.summary = issue.fields.summary;
    temp.jiraLink = getJiraLink(issue.self, issue.key);
    temp.userInWorklog = getListUserInWorklog(issue.fields.worklog.worklogs);
    temp.cost = issue.cost;
    return temp;
  });
};

const convertToListIssueOverDueDate = issues => {
  issues = issues.filter(item => IssueUtils.issueIsBehindSchedule(item));
  return issues.map(issue => {
    let data = {};
    data.key = issue.key;
    data.summary = issue.fields.summary;
    data.jiraLink = getJiraLink(issue.self, issue.key);
    data.userInWorklog = getListUserInWorklog(issue.fields.worklog.worklogs);
    return data;
  });
};

const convertToListIssueHasDegrate = issues => {
  issues = IssueUtils.getListIssueDegrate(issues);
  return issues.map(issue => {
    let data = {};
    data.key = issue.key;
    data.summary = issue.fields.summary;
    data.jiraLink = getJiraLink(issue.self, issue.key);
    data.userInWorklog = getListUserInWorklog(issue.fields.worklog.worklogs);
    return data;
  });
};

const getAllIssueBugInDuration = async (jiraUrl, filters, duration) => {
  let issues = await JiraRepository.getAllIssueBug(jiraUrl, filters, duration);
  let listBugIssues = convertBugIssueList(issues);
  return listBugIssues;
};

const getAllIssuesOverEstimateInDuration = async (jiraUrl, filters, duration) => {
  let issues = await JiraRepository.getAllIssuesOverEstimate(jiraUrl, filters, duration);
  let listBugIssues = convertToListIssuesOverEstimate(issues, duration);
  return listBugIssues;
};

const getAllIssuesOverDueDateInDuration = async (jiraUrl, filters, duration) => {
  let issues = await JiraRepository.getAllIssuesOverDueDate(jiraUrl, filters, duration);
  let neededInfo = extractNeededInfoForExportKpi(issues);

  let more_issues_full_changelog = await limiter.schedule(() => {
    return Promise.all(
      neededInfo.issues_key_full_changelog.map(async issue_key => {
        return {
          key: issue_key,
          changelog: await JiraRepository.getFullChangelog(jiraUrl, issue_key)
        };
      })
    );
  });

  let issuesFullData = getIssuesKpiReport(issues, more_issues_full_changelog, null, duration);

  let listBugIssues = convertToListIssueOverDueDate(issuesFullData);
  return listBugIssues;
};

const getAllIssuesHasDegrate = async (jiraUrl, filters, duration) => {
  let issues = await JiraService.getAllIssuesHasDegrate(jiraUrl, filters, duration);

  let listIssues = convertToListIssueHasDegrate(issues);
  return listIssues;
};

const getQcdSummaryKpiData = async (req, res) => {
  const { filters, duration, jiraUrl } = req.body;
  let issuesList = await getIssuesFullChangelogWorklog(jiraUrl, filters, duration);
  let issueParrentList = getParrentIssueListIn(issuesList);
  let issueSummaryList = issueParrentList.map(x => {
    return new QcdSummaryExport().getQcdSumarry(x);
  });
  res.json(Formatter.success(null, issueSummaryList));
};

const getInvoiceReport = async (req, res) => {
  const { filters, duration, jiraUrl, invoice } = req.body;
  let results = await Promise.all([
    ProjectRepository.getProjectByJiraURLAndKey(jiraUrl, filters.project[0]),
    getIssueSummaryList(jiraUrl, filters, duration),
    getWorklogSheetData([req.body])
  ]);
  let jiraProject = results[0];
  let issuesList = results[1][1];
  let issueSummaryList = results[1][0];
  let { detailData, summaryData, authorsWithEmail } = results[2];
  let worklogData = { ...detailData, ...summaryData, authorsWithEmail };
  let costData = await getProjectCost(filters.project[0], worklogData);

  let projectName = jiraProject.name;
  let { quality, cost, delivery, costTabHour } = new QcdKpi(issuesList);
  let kpiData = { quality, cost, delivery, costTabHour };

  let { data, columns } = new QcdSummaryExport().getDataAndColumns(issueSummaryList);
  let detailIssues = { data, columns };

  let workbook = await writeInvoiceSheetsToExcel(
    projectName,
    duration,
    kpiData,
    detailIssues,
    worklogData,
    costData,
    invoice
  );
  const now = moment().format("YYYY.MM.DD");
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
  res.setHeader("Content-Disposition", `attachment; filename=${projectName}_Summary_report_${now}.xlsx`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  workbook.xlsx.write(res).then(function () {
    res.end();
  });
};

const getProjectCost = async (project_key, worklogData) => {
  let authorsWithEmail = worklogData.authorsWithEmail;
  let summaryRows = worklogData.summaryRows;
  const costData = [];
  for (let i = 0; i < authorsWithEmail.length; i++) {
    let authorWorklog = summaryRows.find(r => r[1] == authorsWithEmail[i].displayName);
    let author = {
      ...authorsWithEmail[i],
      hours: authorWorklog[2].toFixed(2),
      months: (authorWorklog[2] / (8 * 5 * 4)).toFixed(4)
    };
    let additionData = await ProjectCostRepository.getProjectCostByJiraData(null, project_key, author.emailAddress);
    if (!additionData.length) console.error("Cannot expand data: ", author);
    else {
      costData.push({ ...author, role: additionData[0].role, cost: additionData[0].cost });
    }
  }
  return costData;
};

module.exports = {
  getQcdKpiReport,
  getQcdOriginReport,
  getQcdSummaryReport,
  getListBugDetail,
  getListIssueOverEstimate,
  getListIssueOverDueDate,
  getListIssueHasDegrate,
  getQcdSummaryKpiData,
  getInvoiceReport
};
