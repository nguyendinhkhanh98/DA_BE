const Formatter = require("response-format");
const JiraService = require("../../service/jira/index.js");
const IssueUtils = require("../../utils/issue.util.js");

const getUserWorklogInDuration = async (req, res) => {
  let { filters, jiraUrl, duration } = req.body;

  let issues = await JiraService.getAllIssuesWithAllWorklog(jiraUrl, filters, duration);
  issues = issues.map(issue => {
    issue.fields.worklog.worklogs = IssueUtils.getWorklogInDuration(issue.fields.worklog.worklogs, duration);
    issue.fields.worklog.total = issue.fields.worklog.worklogs.length;
    return issue;
  });

  res.json(Formatter.success(null, issues));
};

module.exports = {
  getUserWorklogInDuration
};
