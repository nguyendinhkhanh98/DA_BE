const _ = require("lodash");
const axios = require("axios");
const username = process.env.JIRA_USERNAME;
const apiToken = process.env.API_TOKEN;
const logger = require("../../utils/logger.js")(__filename);

/**
 * Get list issue with base is full infomation
 * But changelog and worklog is limit 100
 * Need call more changelog and worklog if necessary
 *
 * @param {String} jiraUrl URL to jira api
 * @param {Object} filters filter object
 * @param {Array | null} duration duration get issue
 */
const getAllIssue = async (jiraUrl, filters, duration) => {
  // Block1: Call issue from jira
  let jqlString = convertFilterToJql(filters, duration);
  logger.debug("JQL: ", jqlString);
  let totalIssues = await getCountIssueList(jiraUrl, jqlString);

  let p = [];
  for (let i = 0; i < totalIssues / 100; i++) {
    let bodyData = {
      expand: ["changelog"],
      jql: jqlString,
      maxResults: 100,
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
        "worklog",
        "parent",
        "customfield_11130",
        "linkedIssue"
      ],
      startAt: i * 100
    };
    p[i] = searchIssueByJql(jiraUrl, bodyData);
  }
  const response = await Promise.all(p);

  // Block2: Merge to an array and return it
  let totalIssuesList = [];
  response.forEach(item => (totalIssuesList = totalIssuesList.concat(item.issues)));
  return totalIssuesList;
};

/**
 * Get list issue contain sumarry and worklog in fields
 * But worklog is limit 20
 * Need call more worklog if necessary
 *
 * @param {String} jiraUrl URL to jira api
 * @param {Object} filters filter object
 * @param {Array | null} duration duration get issue
 */
const getAllIssueBug = async (jiraUrl, filters, duration) => {
  // Block1: Call issue from jira
  let jqlString = convertFilterToJql(filters, duration);
  logger.debug("JQL issue bug: ", jqlString);
  let totalIssues = await getCountIssueList(jiraUrl, jqlString);

  let p = [];
  for (let i = 0; i < totalIssues / 100; i++) {
    let bodyData = {
      expand: [""],
      jql: jqlString,
      maxResults: 100,
      fieldsByKeys: false,
      fields: ["summary", "worklog"],
      startAt: i * 100
    };
    p[i] = searchIssueByJql(jiraUrl, bodyData);
  }
  const response = await Promise.all(p);

  // Block2: Merge to an array and return it
  let totalIssuesList = [];
  response.forEach(item => (totalIssuesList = totalIssuesList.concat(item.issues)));
  return totalIssuesList;
};

/**
 * Get list issue contain ["summary", "timetracking", "worklog"] in fields
 * But worklog is limit 20
 * Need call more worklog if necessary
 *
 * @param {String} jiraUrl URL to jira api
 * @param {Object} filters filter object
 * @param {Array | null} duration duration get issue
 */
const getAllIssuesOverEstimate = async (jiraUrl, filters, duration) => {
  // Block1: Call issue from jira
  let jqlString = convertFilterToJql(filters, duration);
  logger.debug("JQL issues over estimate: ", jqlString);
  let totalIssues = await getCountIssueList(jiraUrl, jqlString);

  let p = [];
  for (let i = 0; i < totalIssues / 100; i++) {
    let bodyData = {
      expand: [""],
      jql: jqlString,
      maxResults: 100,
      fieldsByKeys: false,
      fields: ["summary", "timetracking", "worklog"],
      startAt: i * 100
    };
    p[i] = searchIssueByJql(jiraUrl, bodyData);
  }
  const response = await Promise.all(p);

  // Block2: Merge to an array and return it
  let totalIssuesList = [];
  response.forEach(item => (totalIssuesList = totalIssuesList.concat(item.issues)));
  return totalIssuesList;
};

/**
 * Get list issue contain changelog, worklog and some another fields
 * But changelog and worklog is limited
 * Need call more changelog, worklog if necessary
 *
 * @param {String} jiraUrl URL to jira api
 * @param {Object} filters filter object
 * @param {Array | null} duration duration get issue
 */
const getAllIssuesOverDueDate = async (jiraUrl, filters, duration) => {
  // Block1: Call issue from jira
  let jqlString = convertFilterToJql(filters, duration);
  logger.debug("JQL issues over duedate: ", jqlString);
  let totalIssues = await getCountIssueList(jiraUrl, jqlString);

  let p = [];
  for (let i = 0; i < totalIssues / 100; i++) {
    let bodyData = {
      expand: ["changelog"],
      jql: jqlString,
      maxResults: 100,
      fieldsByKeys: false,
      fields: ["summary", "timetracking", "duedate", "status", "worklog"],
      startAt: i * 100
    };
    p[i] = searchIssueByJql(jiraUrl, bodyData);
  }
  const response = await Promise.all(p);
  let totalIssuesList = [];
  response.forEach(item => (totalIssuesList = totalIssuesList.concat(item.issues)));
  return totalIssuesList;
};

/**
 * Get full changelog of issue has issueIdOrKey
 *
 * @param {String} jiraUrl Url to jira api
 * @param {String} issueIdOrKey IssueKeyOrID
 */
const getFullChangelog = async (jiraUrl, issueIdOrKey) => {
  try {
    let options = {
      method: "GET",
      url: `${jiraUrl}/rest/api/3/issue/${issueIdOrKey}/changelog`,
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
          url: `${jiraUrl}/rest/api/3/issue/${issueIdOrKey}/changelog?startAt=${startAt}`,
          auth: { username: username, password: apiToken },
          headers: {
            Accept: "application/json"
          }
        };
        p[i] = axios(option);
      }
      let values = [];
      values = values.concat(data.values);
      for (let i = 0; i < p.length; i++) {
        let response = await p[i];
        values = values.concat(response.data.values);
      }
      return values;
    } else {
      return data.values;
    }
  } catch (error) {
    logger.debug(issueIdOrKey);
  }
};

/**
 * Get full worklog of issue has issueIdOrKey
 *
 * @param {String} jiraUrl Url to jira api
 * @param {String} issueIdOrKey IssueKeyOrID
 */
const getFullWorklog = async (jiraUrl, issueIdOrKey) => {
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

/**
 * Get count issue list follow jql in param
 *
 * @param {String} jiraUrl Url to jira api
 * @param {String} jqlString JQL string follow jira's format
 */
const getCountIssueList = async (jiraUrl, jqlString) => {
  let options = {
    method: "POST",
    url: `${jiraUrl}/rest/api/3/search`,
    auth: { username: username, password: apiToken },
    headers: {
      Accept: "application/json"
    },
    data: { jql: jqlString }
  };
  const { data } = await axios(options);
  return data.total;
};

// -------------------- HANDLE FUNCTION ----------------------//
// -------------------- HANDLE FUNCTION ----------------------//
// -------------------- HANDLE FUNCTION ----------------------//

const convertFilterToJql = (filters, duration) => {
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

const searchIssueByJql = async (jiraUrl, requestPayload) => {
  let options = {
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

const getAllIssueIn = async (jiraUrl, project, issueKeys) => {
  // Block1: Call issue from jira
  let issueStr = issueKeys.join(",");
  let projectStr = project.join(",");
  let jqlString = `
  project in (${projectStr}) AND key in (${issueStr})
  `;
  logger.debug("JQL: ", jqlString);
  let totalIssues = await getCountIssueList(jiraUrl, jqlString);

  let p = [];
  for (let i = 0; i < totalIssues / 100; i++) {
    let bodyData = {
      expand: ["changelog"],
      jql: jqlString,
      maxResults: 100,
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
        "worklog",
        "parent",
        "customfield_11130",
        "linkedIssue"
      ],
      startAt: i * 100
    };
    p[i] = searchIssueByJql(jiraUrl, bodyData);
  }
  const response = await Promise.all(p);

  // Block2: Merge to an array and return it
  let totalIssuesList = [];
  response.forEach(item => (totalIssuesList = totalIssuesList.concat(item.issues)));
  return totalIssuesList;
};

// Don't write jira service here, write to service/jira
// Only write atom function call to Jira api
module.exports = {
  convertFilterToJql,
  searchIssueByJql,
  getCountIssueList,

  getAllIssue,
  getFullChangelog,
  getFullWorklog,
  getAllIssueBug,
  getAllIssuesOverEstimate,
  getAllIssuesOverDueDate,
  getAllIssueIn
};
