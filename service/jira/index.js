const _ = require("lodash");
const Bottleneck = require("bottleneck/es5");
const IssueUtils = require("../../utils/issue.util.js");
const JiraRepository = require("../../repository/jira-repository/issue.jira.repository.js");
const logger = require("../../utils/logger.js")(__filename);

const limiter = new Bottleneck({
  maxConcurrent: 2,
  minTime: 10
});

/**
 * Get list issue with worklog is filled
 *
 * @param {String} jiraUrl URL to jira api
 * @param {Object} filters filter object
 * @param {Array | null} duration duration get issue
 */
const getAllIssuesWithAllWorklog = async (jiraUrl, filters, duration) => {
  const limiter = new Bottleneck({
    maxConcurrent: 2,
    minTime: 100
  });

  // Block1: Call issue from jira
  let jqlString = JiraRepository.convertFilterToJql(filters, duration);
  let totalIssues = await JiraRepository.getCountIssueList(jiraUrl, jqlString);

  let p = [];
  for (let i = 0; i < totalIssues / 100; i++) {
    let bodyData = {
      jql: jqlString,
      maxResults: 100,
      fieldsByKeys: false,
      fields: ["worklog", "project"],
      startAt: i * 100
    };
    p[i] = JiraRepository.searchIssueByJql(jiraUrl, bodyData);
  }
  const response = await limiter.schedule(() => {
    return Promise.all(p);
  });
  let totalIssuesList = [];
  response.forEach(item => (totalIssuesList = totalIssuesList.concat(item.issues)));

  //Block2: Get all issue need more worklog
  let issues_key_full_worklog = getIssueKeyNeedMoreWorkLog(totalIssuesList);

  let more_issues_full_worklog = await Promise.all(
    issues_key_full_worklog.map(async issue_key => {
      return {
        key: issue_key,
        worklog: await JiraRepository.getFullWorklog(jiraUrl, issue_key)
      };
    })
  );

  return mergeIssueWithChangelogAndWorklog(totalIssuesList, null, more_issues_full_worklog, duration);
};

/**
 * Get list issue with full infomation of changelog and worklog
 *
 * @param {String} jiraUrl URL to jira api
 * @param {Object} filters filter object
 * @param {Array | null} duration duration get issue
 */
const getIssuesWithAllWorklogAndChangelog = async (jiraUrl, filters, duration) => {
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

  let more_issues_full_worklog = await Promise.all(
    neededInfo.issues_key_full_worklog.map(async issue_key => {
      return {
        key: issue_key,
        worklog: await JiraRepository.getFullWorklog(jiraUrl, issue_key)
      };
    })
  );

  issuesFullData = mergeIssueWithChangelogAndWorklog(
    issues,
    more_issues_full_changelog,
    more_issues_full_worklog,
    duration
  );
  return issuesFullData;
};

/**
 * Get list issue contain customfield_11130 => Contain degrate
 *
 * @param {String} jiraUrl URL to jira api
 * @param {Object} filters filter object
 * @param {Array | null} duration duration get issue
 */
const getAllIssuesHasDegrate = async (jiraUrl, filters, duration) => {
  // Block1: Call issue from jira
  let jqlString = JiraRepository.convertFilterToJql(filters, duration);
  logger.debug("JQL issue has degrate: ", jqlString);
  let totalIssues = await JiraRepository.getCountIssueList(jiraUrl, jqlString);

  let p = [];
  for (let i = 0; i < totalIssues / 100; i++) {
    let bodyData = {
      jql: jqlString,
      maxResults: 100,
      fieldsByKeys: false,
      fields: ["customfield_11130", "worklog", "summary"],
      startAt: i * 100
    };
    p[i] = JiraRepository.searchIssueByJql(jiraUrl, bodyData);
  }
  const response = await Promise.all(p);
  let totalIssuesList = [];
  response.forEach(item => (totalIssuesList = totalIssuesList.concat(item.issues)));

  //Block2: Get all issue need more worklog
  let issues_key_full_worklog = getIssueKeyNeedMoreWorkLog(totalIssuesList);

  let more_issues_full_worklog = await Promise.all(
    issues_key_full_worklog.map(async issue_key => {
      return {
        key: issue_key,
        worklog: await JiraRepository.getFullWorklog(jiraUrl, issue_key)
      };
    })
  );

  return mergeIssueWithChangelogAndWorklog(totalIssuesList, null, more_issues_full_worklog, duration);
};

// --------------------------- HANDLE FUNCTION ------------------------------//
// --------------------------- HANDLE FUNCTION ------------------------------//
// --------------------------- HANDLE FUNCTION ------------------------------//

const extractNeededInfoForExportKpi = function (issues) {
  let issues_key_full_changelog = getIssueKeyNeedMoreChangeLog(issues);
  logger.debug("Issue need get Change Log: ", issues_key_full_changelog.length, issues_key_full_changelog);
  let issues_key_full_worklog = getIssueKeyNeedMoreWorkLog(issues);
  logger.debug("Issue need get Work Log: ", issues_key_full_worklog.length, issues_key_full_worklog);
  return { issues_key_full_changelog, issues_key_full_worklog };
};

function getIssueKeyNeedMoreChangeLog(issues) {
  return issues.filter(issue => issue.changelog.total > 100).map(item => item.key);
}

function getIssueKeyNeedMoreWorkLog(issues) {
  // if call worklog with api search issue, maxResults = 20
  // else if call by api get worklog, maxResults = 100
  return issues.filter(issue => issue.fields.worklog.total > issue.fields.worklog.maxResults).map(item => item.key);
}

const mergeIssueWithChangelogAndWorklog = function (issues, issuesChangelogs, issuesWorklogs, duration) {
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

module.exports = {
  getAllIssuesWithAllWorklog,
  getIssuesWithAllWorklogAndChangelog,
  getAllIssuesHasDegrate
};
