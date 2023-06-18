const axios = require("axios");
const _ = require("lodash");
const username = process.env.JIRA_USERNAME;
const apiToken = process.env.API_TOKEN;
const JiraService = require("../../service/jira/index.js");
const JiraRepository = require("../../repository/jira-repository/issue.jira.repository.js");
const { writeMonthlyReport } = require("../../service/excel/index.js");
const { getWorklogSheetData } = require("../../service/worklog/index.js");
const IssueUtils = require("../../utils/issue.util.js");
const TaskRepository = require("../../repository/postgres-repository/task.repository");
const logger = require("../../utils/logger.js")(__filename);

const getTimeSheetUser = async (req, res) => {
  const { filters, jiraUrl, duration } = req.body;
  const issues = await JiraService.getAllIssuesWithAllWorklog(jiraUrl, filters, duration);
  logger.debug("Total issues getTimeSheetUser: ", issues.length);

  const result = await filterWorklogByUserAndDuration(jiraUrl, filters, issues, duration);
  const totalTimeSpent = IssueUtils.getTotalTimeSpentAllIssuesInDuration(result.issues);
  logger.debug("Total timespent getTimeSheetUser: ", totalTimeSpent);
  res.json(result);
};

const getAllUserInCompany = (req, res) => {
  const { projects, jiraUrl } = req.body;
  let p = [];
  projects.map(item => {
    let options = {
      method: "GET",
      url: `${jiraUrl}/rest/api/3/user/assignable/multiProjectSearch?projectKeys=${item}`,
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

const getAllProjectArrow = async (req, res) => {
  const { jiraUrl } = req.body;
  let options = {
    method: "GET",
    url: `${jiraUrl}/rest/api/3/project`,
    auth: { username: username, password: apiToken },
    headers: {
      Accept: "application/json"
    }
  };
  try {
    let response = await axios(options);
    let projects = response.data.filter(item => !item.isPrivate);
    res.json(projects);
  } catch (error) {
    logger.error(error);
  }
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

const exportMonthlyReport = async (req, res) => {
  const { workspaces, worklogAuthor, duration } = req.body;

  let payloads = [];
  workspaces.forEach(workspace => {
    let payload = {
      filters: {
        project: workspace.projects,
        worklogAuthor: worklogAuthor
      },
      jiraUrl: workspace.jiraUrl,
      duration
    };
    payloads.push(payload);
  });
  // console.log("payloads", payloads);
  // console.log("payloads.filters", payloads[0].filters)
  let worklogData = await getWorklogSheetData(payloads, true);
  // console.log("worklogData", worklogData);
  // console.log("detailData", worklogData.detailData);
  // console.log("summaryData", worklogData.summaryData);
  let linkedProjects = await TaskRepository.getAllLinkedTasks();
  // console.log("linkedProject", linkedProjects);
  let userRoles = await TaskRepository.getUserRolesByTaskIds(linkedProjects.map(p => p.id));
  // console.log("userRoles", userRoles);

  let workbook = await writeMonthlyReport(duration, worklogData, userRoles);
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
  res.setHeader("Content-Disposition", `attachment; filename=Monthly_Report.xlsx`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  workbook.xlsx.write(res).then(function () {
    res.end();
  });
};

module.exports = {
  getTimeSheetUser,
  getAllProjectArrow,
  getAllUserInCompany,
  filterWorklogByUserAndDuration,
  exportMonthlyReport
};
