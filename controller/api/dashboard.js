const knex = require("../../config/database");
const axios = require("axios");
const _ = require("lodash");
const moment = require("moment");
const FORMAT_DATE = "YYYY/MM/DD";
const username = process.env.JIRA_USERNAME;
const apiToken = process.env.API_TOKEN;
const UserPerformanceRepository = require("../../repository/postgres-repository/user-performance.repository");
const UserRepository = require("../../repository/postgres-repository/user.repository");

const getStatusOfTheTask = async (req, res) => {
  const { sprint } = req.query;
  const issues = await getIssueInSprint(sprint);
  return res.json(issues);
};

const getUserWorklog = async (req, res) => {
  const { sprint, startDate, endDate } = req.query;
  const issues = await getIssueInSprint(sprint, startDate, endDate);
  return res.json(issues);
};

const getWorkingPerformance = async (req, res) => {
  const { sprint, startDate, endDate } = req.query;
  let query = UserPerformanceRepository.getUserPerformanceBySprint(sprint);
  if (startDate) {
    query.where("work_date", ">=", startDate);
  }
  if (endDate) {
    query.where("work_date", "<=", endDate);
  }
  let users = await query.select();
  users.forEach(user => {
    user.workDate = moment(user.workDate).format("YYYY-MM-DD");
  });
  return res.json(users);
};

const getAllUsersInfo = async (req, res) => {
  const users = await UserRepository.getAllUserInfo();
  return res.json(users);
};

const getIssueInSprint = async (sprint, startDate, endDate) => {
  var startAt = 0;
  var requestPayload = {
    jql: `sprint = '${sprint}'`,
    maxResults: 100,
    fieldsByKeys: false,
    fields: ["worklog", "status"],
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
        }
        if (startDate) {
          issue.fields.worklog.worklogs = issue.fields.worklog.worklogs.filter(
            worklog => !moment(startDate).isAfter(moment(worklog.started.substring(0, 10)))
          );
        }
        if (endDate) {
          issue.fields.worklog.worklogs = issue.fields.worklog.worklogs.filter(
            worklog => !moment(endDate).isBefore(moment(worklog.started.substring(0, 10)))
          );
        }
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
            issue.fields.worklog = await getIssueWorklogs(issue.key);
          }
          if (startDate) {
            issue.fields.worklog.worklogs = issue.fields.worklog.worklogs.filter(
              worklog => !moment(startDate).isAfter(moment(worklog.started.substring(0, 10)))
            );
          }
          if (endDate) {
            issue.fields.worklog.worklogs = issue.fields.worklog.worklogs.filter(
              worklog => !moment(endDate).isBefore(moment(worklog.started.substring(0, 10)))
            );
          }
          issue.fields.worklog.total = issue.fields.worklog.worklogs.length;
        })
        .concat(
          Array.apply(null, Array(countApi)).map(async (item, index) => {
            let startAt = index * 100 + 100;
            let requestPayload = {
              jql: jql,
              maxResults: 100,
              fieldsByKeys: false,
              fields: ["worklog", "status"],
              startAt: startAt
            };
            let dataTemp = await searchIssuesJql(requestPayload);
            await Promise.all(
              dataTemp.issues.map(async (issue, index) => {
                const { worklog } = issue.fields;
                if (worklog.total > worklog.maxResults) {
                  issue.fields.worklog = await getIssueWorklogs(issue.key);
                }
                if (startDate) {
                  issue.fields.worklog.worklogs = issue.fields.worklog.worklogs.filter(
                    worklog => !moment(startDate).isAfter(moment(worklog.started.substring(0, 10)))
                  );
                }
                if (endDate) {
                  issue.fields.worklog.worklogs = issue.fields.worklog.worklogs.filter(
                    worklog => !moment(endDate).isBefore(moment(worklog.started.substring(0, 10)))
                  );
                }
                issue.fields.worklog.total = issue.fields.worklog.worklogs.length;
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

const getActiveSprints = async (req, res) => {
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
  var currentSprint = await getAllActiveSprints(currentBoard.id);
  return res.json(_.orderBy(currentSprint.values, "id", ["desc"]));
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

/**
 * get list change log to evaluate performance for Dev team, Leader team, Tester team
 *
 * @param {Request} req Request express object
 * @param {Response} res Response express object
 */
const getChangeLogIssue = async (req, res) => {
  const { sprint, startDate, endDate } = req.query;

  // Fetch all issue from jira server
  var startAt = 0;
  var requestPayload = {
    jql: `sprint = '${sprint}'`,
    maxResults: 20,
    fieldsByKeys: false,
    fields: ["created", "project", "issuetype"],
    startAt: startAt
  };
  let data = await searchIssuesJql(requestPayload);
  if (data.total > 20) {
    const countApi = Math.floor(data.total / 20);
    let promise = [];
    for (let i = 0; i < countApi; i++) {
      let option = {
        ...requestPayload,
        startAt: (i + 1) * 20
      };
      promise[i] = searchIssuesJql(option);
    }
    const datas = await Promise.all(promise);

    datas.map(item => {
      data.issues = data.issues.concat(item.issues);
    });
  }

  // Get all change log each issue
  // If total change log > 100 => call multi time
  await Promise.all(
    data.issues.map(async element => {
      const changelog = await getChangelogIssueById(element.key, req); // need
      element.changelog = {
        total: changelog.length,
        histories: changelog
      };
    })
  );

  let originData = _.cloneDeep(data);
  //Filter issue by Time: startDate <= created change log <= endDate
  {
    let promise = [];
    for (let i = 0; i < data.total; i++) {
      promise[i] = handleIssueByTimeRange(data.issues[i], startDate, endDate);
    }
    const handleResponses = await Promise.all(promise);
    data.issues = [..._.filter(handleResponses, o => o)];
    data.total = data.issues.length;
  }

  //Format data follow AM-16
  let dataFilter = await handleIssueStatus(data);

  return res.json({ originData, dataFilter });
};

/**
 * Get changelog issue if total changelog > 100
 *
 * @param {String} issueId id or key of issue
 * @param {Request} req Request object of express
 */
const getChangelogIssueById = async (issueId, req) => {
  var options = {
    method: "GET",
    url: `${req.user.jiraUrl}/rest/api/3/issue/${issueId}/changelog`,
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
        url: `${req.user.jiraUrl}/rest/api/3/issue/${issueId}/changelog?startAt=${startAt}`,
        auth: { username: username, password: apiToken },
        headers: {
          Accept: "application/json"
        }
      };
      p[i] = axios(option);
    }
    const datas = await Promise.all(p);
    var values = [];
    values = values.concat(data.values);
    datas.map(data => {
      values = values.concat(data.data.values);
    });
    return values;
  } else {
    return data.values;
  }
};

//================================= HANDLE FUNCTION AREA ====================================//
//================================= HANDLE FUNCTION AREA ====================================//
//================================= HANDLE FUNCTION AREA ====================================//

const handleIssueByTimeRange = async (issue, startDate, endDate) => {
  let dueDate = {
    found: false,
    value: null,
    index: -1
  };
  let earlyItem = { ...dueDate };
  let latestItem = { ...dueDate };

  let historyLen = issue.changelog.histories.length;
  if (historyLen <= 0) return null;
  // Created changelog sort by early => latest, time[0] = 01/01/2020 => time[n] = 12/12/2020
  for (let i = 0; i < historyLen; i++) {
    let element = issue.changelog.histories[i];

    // find first duedate of range time
    // duedate is require when change from open -> in progress
    // get duedate when change to in progress, not get else
    let tempDueDate = _.find(element.items, { field: "duedate" });
    let tempStatus = _.find(element.items, { field: "status" });
    if (tempDueDate && tempStatus && !dueDate.found) {
      dueDate.found = earlyItem.found ? true : false;
      dueDate.value = element;
      dueDate.index = i;
    }

    // find early changelog issue in range time
    if (
      !earlyItem.found &&
      !moment(element.created, FORMAT_DATE).isBefore(moment(startDate, FORMAT_DATE)) &&
      !moment(element.created, FORMAT_DATE).isAfter(moment(endDate, FORMAT_DATE))
    ) {
      earlyItem.found = true;
      earlyItem.value = element;
      earlyItem.index = i;
    }

    // find latest changelog issue in range has modify
    if (
      earlyItem.found &&
      !latestItem.found &&
      moment(element.created, FORMAT_DATE).isAfter(moment(endDate, FORMAT_DATE))
    ) {
      latestItem.found = true;
      latestItem.value = issue.changelog.histories[i - 1];
      latestItem.index = i - 1;
    }
  }
  if (!moment(issue.changelog.histories[historyLen - 1].created, FORMAT_DATE).isAfter(moment(endDate, FORMAT_DATE))) {
    latestItem.found = true;
    latestItem.value = issue.changelog.histories[historyLen - 1];
    latestItem.index = historyLen - 1;
  }

  // slide changelog of issue
  // from duedate -> latest if duedate <= early
  // else from early => latest

  // if not found duedate && early && latest => not in time range => return null
  if (dueDate.value && earlyItem.value && latestItem.value) {
    let index = !moment(dueDate.value.created, FORMAT_DATE).isAfter(moment(earlyItem.value.created, FORMAT_DATE))
      ? dueDate.index
      : earlyItem.index;
    issue.changelog.histories = _.slice(issue.changelog.histories, index, latestItem.index + 1);
  } else return null;

  // filter issue history
  // select history change status
  // get duedate again, if first action in time range is change status -> in progress
  issue.changelog.histories = issue.changelog.histories.filter(item => _.find(item.items, { field: "status" }));
  if (issue.changelog.histories.length) {
    let tempDueDate = _.find(issue.changelog.histories[0].items, { field: "duedate" });
    let tempStatus = _.find(issue.changelog.histories[0].items, { field: "status" });

    if (tempDueDate && tempStatus && tempStatus.toString == "In Progress") {
      dueDate.found = true;
      dueDate.value = issue.changelog.histories[0];
      dueDate.index = 0;
    }
  }

  // remove some field unnessary
  let lastDueDate = dueDate.value ? _.find(dueDate.value.items, { field: "duedate" }).toString : null;
  issue = {
    id: issue.id,
    key: issue.key,
    created: issue.fields.created,
    projectKey: issue.fields.project.key,
    changelog: issue.changelog.histories,
    lastDueDate: lastDueDate,
    issueType: issue.fields.issuetype
  };

  return issue.changelog.length ? issue : null;
};

const handleIssueStatus = async data => {
  // Created changelog sort by early => latest, time[0] = 01/01/2020 => time[n] = 12/12/2020
  let dev = [];
  let leader = [];
  let tester = [];

  //connect issue with each history changelog
  _.map(data.issues, issue => {
    let tempStatus = [];
    let complete = 0;
    // find status of issue
    // if issue update to "Waiting for IT" or "Waiting UAT"
    // => update complete
    _.map(issue.changelog, changelog => {
      let status = _.find(changelog.items, { field: "status" });
      if (status) {
        let item = {
          issueKey: issue.key,
          createdLog: changelog.created,
          author: changelog.author,
          status: status,
          projectKey: issue.projectKey,
          lastDueDate: issue.lastDueDate,
          issueType: issue.issueType
        };
        tempStatus.push(item);

        let toIT = status.toString == "Waiting for IT" && issue.issueType.name == "Task";
        let toUAT = status.toString == "Waiting UAT" && issue.issueType.name != "Task";
        if (toIT || toUAT) {
          // Task in arrow tech work
          complete = !moment(issue.lastDueDate, FORMAT_DATE).isBefore(moment(changelog.created, FORMAT_DATE)) ? 1 : 2;
        }
      }
    });

    // if task completed => set status and push to role
    if (complete) {
      _.map(tempStatus, element => {
        element.complete = complete == 1 ? true : false;
        switch (element.status.toString) {
          case "Waiting for Review":
            dev.push(element);
            break;
          case "Waiting for IT":
            leader.push(element);
            break;
          case "Waiting UAT":
            tester.push(element);
            break;
        }
      });
    }
  });
  return { dev, leader, tester };
};

module.exports = {
  getActiveSprints,
  getAllUsersInfo,

  getWorkingPerformance,
  getStatusOfTheTask,
  getUserWorklog,

  getChangeLogIssue // in new version
};
