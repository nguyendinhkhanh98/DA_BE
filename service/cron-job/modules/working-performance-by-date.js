const CronJob = require("cron").CronJob;
const knex = require("../../../config/database");
const axios = require("axios");
const CONSTANT = require("../../../utils/const");
const moment = require("moment");
const _ = require("lodash");
const username = CONSTANT.USERNAME;
const apiToken = CONSTANT.API_TOKEN;

const workingPerformanceByDate = () => {
  const job = new CronJob("00 00 19 * * *", async function () {
    const currentSprints = await getCurrentSprints();
    currentSprints.forEach(async currentSprint => {
      const issueInCurrentSprint = await getIssueInSprint(currentSprint.id);
      const users = await knex
        .select()
        .column("user.id", "email", { role: "role.name" })
        .from("user")
        .leftJoin("user_role", "user.id", "user_role.user_id")
        .leftJoin("role", "role.id", "user_role.role_id");
      const usersJira = await getAllUsersJira();
      const devCoefficient = 0.75;
      const testerCoefficient = 0.2;
      const leaderCoefficient = 0.05;
      users
        .filter(user => usersJira.some(userJira => userJira.emailAddress && userJira.emailAddress === user.email))
        .forEach(async user => {
          let EV = 0;
          let AC = 0;
          issueInCurrentSprint.issues.forEach(issue => {
            const { worklogs } = issue.fields.worklog;
            if (
              worklogs.length &&
              _.findIndex(worklogs, worklog => worklog.author.emailAddress === user.email) > -1 &&
              _.findIndex(
                worklogs,
                worklog =>
                  !moment(worklog.started.substring(0, 10)).isBefore(
                    moment(currentSprint.startDate.substring(0, 10))
                  ) && !moment(worklog.started.substring(0, 10)).isAfter(moment(currentSprint.endDate.substring(0, 10)))
              ) > -1
            ) {
              EV += issue.fields.timetracking.originalEstimateSeconds || 0;
              worklogs.forEach(worklog => {
                if (
                  worklog.author.emailAddress === user.email &&
                  !moment(worklog.started.substring(0, 10)).isBefore(
                    moment(currentSprint.startDate.substring(0, 10))
                  ) &&
                  !moment(worklog.started.substring(0, 10)).isAfter(moment(currentSprint.endDate.substring(0, 10)))
                ) {
                  AC += worklog.timeSpentSeconds;
                }
              });
            }
          });
          let role = user.role;
          let coefficient = 0;
          switch (role) {
            case "developer":
              coefficient = devCoefficient;
              break;
            case "tester":
              coefficient = testerCoefficient;
              break;
            case "leader":
              coefficient = leaderCoefficient;
              break;
            default:
              break;
          }
          let CPI = AC ? (EV * coefficient) / AC : 0;
          await knex
            .insert({
              user_id: user.id,
              work_date: new Date(),
              sprint: currentSprint.name,
              cpi: CPI
            })
            .into("user_performance");
        });
    });
  });
  job.start();
};

const getIssueInSprint = async sprintId => {
  let jql = `Sprint = ${sprintId} AND status in ("Waiting UAT", "UAT in progress", "Resolved") order by created DESC`;
  var startAt = 0;
  var requestPayload = {
    jql: jql,
    maxResults: 100,
    fieldsByKeys: false,
    fields: ["worklog", "timetracking"],
    startAt: startAt
  };
  var data = await searchIssuesJql(requestPayload);
  const { total } = data;
  if (total <= 100) {
    await Promise.all(
      data.issues.map(async issue => {
        const { worklog } = issue.fields;
        if (worklog.total > worklog.maxResults) {
          issue.fields.worklog = await getIssueWorklogs(issue.key);
          issue.fields.worklog.total = issue.fields.worklog.worklogs.length;
        }
      })
    );
  } else {
    const countApi = Math.ceil(total / 100) - 1;
    await Promise.all(
      data.issues
        .map(async issue => {
          const { worklog } = issue.fields;
          if (worklog.total > worklog.maxResults) {
            issue.fields.worklog = await getIssueWorklogs(issue.key);
            issue.fields.worklog.total = issue.fields.worklog.worklogs.length;
          }
        })
        .concat(
          Array.apply(null, Array(countApi)).map(async (item, index) => {
            let startAt = index * 100 + 100;
            let requestPayload = {
              jql: jql,
              maxResults: 100,
              fieldsByKeys: false,
              fields: ["worklog", "timetracking"],
              startAt: startAt
            };
            let dataTemp = await searchIssuesJql(requestPayload);
            await Promise.all(
              dataTemp.issues.map(async (issue, index) => {
                const { worklog } = issue.fields;
                if (worklog.total > worklog.maxResults) {
                  issue.fields.worklog = await getIssueWorklogs(issue.key);
                  issue.fields.worklog.total = issue.fields.worklog.worklogs.length;
                }
              })
            );
            data.issues = data.issues.concat(dataTemp.issues);
          })
        )
    );
    data.maxResults = data.issues.length;
  }
  return data;
};

const getCurrentSprints = async () => {
  var currentProject;
  var requestPayload = {
    jql: "order by created DESC",
    maxResults: 50,
    fieldsByKeys: false,
    fields: ["project"],
    startAt: 0
  };
  var responses = await Promise.all([getAllBoards(), searchIssuesJql(requestPayload)]);
  var projectKeys = responses[1].issues.map(item => item.fields.project.key);
  // get project most appear
  currentProject = _.head(_(projectKeys).countBy().entries().maxBy(_.last));
  var currentBoard = _.find(responses[0].values, value => value.location.projectKey === currentProject);
  var currentSprints = await getAllActiveSprints(currentBoard.id);
  // return _.orderBy(currentSprint.values, "id", ["desc"])[0];
  return currentSprints.values;
};

const getIssueWorklogs = async issueIdOrKey => {
  var options = {
    method: "GET",
    url: `${process.env.BASE_JIRA_URL}/rest/api/3/issue/${issueIdOrKey}/worklog?startAt=0&maxResults=1000`,
    auth: { username: username, password: apiToken },
    headers: {
      Accept: "application/json"
    }
  };
  const { data } = await axios(options);
  return data;
};

const searchIssuesJql = async requestPayload => {
  var options = {
    method: "POST",
    url: `${process.env.BASE_JIRA_URL}/rest/api/3/search`,
    auth: { username: username, password: apiToken },
    headers: {
      Accept: "application/json"
    },
    data: requestPayload
  };
  const { data } = await axios(options);
  return data;
};

const getAllBoards = async () => {
  var options = {
    method: "GET",
    url: `${process.env.BASE_JIRA_URL}/rest/agile/1.0/board`,
    auth: { username: username, password: apiToken },
    headers: {
      Accept: "application/json"
    }
  };
  const { data } = await axios(options);
  return data;
};

const getAllUsersJira = async () => {
  var options = {
    method: "GET",
    url: `${process.env.BASE_JIRA_URL}/rest/api/3/users/search`,
    auth: { username: username, password: apiToken },
    headers: {
      Accept: "application/json"
    }
  };
  var { data } = await axios(options);
  return data;
};

const getAllActiveSprints = async boardId => {
  var options = {
    method: "GET",
    url: `${process.env.BASE_JIRA_URL}/rest/agile/1.0/board/${boardId}/sprint?state=active`,
    auth: { username: username, password: apiToken },
    headers: {
      Accept: "application/json"
    }
  };
  var { data } = await axios(options);
  return data;
};

module.exports = { workingPerformanceByDate };
