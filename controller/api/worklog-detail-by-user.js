const axios = require("axios");
const moment = require("moment");
const _ = require("lodash");
const { filter } = require("lodash");
const username = process.env.JIRA_USERNAME;
const apiToken = process.env.API_TOKEN;

const getUserWorklogs = async (req, res) => {
  const { since, until, jiraUrl } = req.body;
  let query = `?since=${since}`;

  let worklogIds = [];
  let nextPage = "";
  do {
    await axios(
      options(
        "GET",
        nextPage ? `worklog/updated?since=${nextPage.substring(nextPage.length - 13)}` : `worklog/updated${query}`,
        false,
        jiraUrl
      )
    )
      .then(response => {
        worklogIds = worklogIds.concat(response.data.values.map(worklog => worklog.worklogId));

        if (response.data.nextPage) {
          nextPage = response.data.nextPage;
        } else {
          nextPage = "";
        }
      })
      .catch(error => {
        const { status, data } = error.response;
        return res.status(status).json(data);
      });
  } while (nextPage);

  let worklogs = [];
  let startIndex = 0;
  let endIndex = 1000;
  let callCount = 0;
  do {
    await axios(options("POST", "worklog/list", { ids: worklogIds.slice(startIndex, endIndex) }, jiraUrl))
      .then(response => {
        worklogs = worklogs.concat(response.data);
        startIndex += 1000;
        endIndex += 1000;
        callCount++;
      })
      .catch(error => {
        const { status, data } = error.response;
        return res.status(status).json(data);
      });
  } while (callCount < worklogIds.length / 1000);
  worklogs = worklogs.filter(
    worklog => moment(worklog.started).valueOf() > since && moment(worklog.started).valueOf() < until
  );

  let { authors, filters } = req.body;
  filters.id = worklogs.map(worklog => worklog.issueId);
  let jqlString = convertToJqlString(filters);

  let data;
  let total;
  await axios(options("POST", "search", { jql: jqlString, maxResults: 0 }, jiraUrl))
    .then(response => {
      data = response.data;
      total = data.total;
    })
    .catch(error => {
      const { status, data } = error.response;
      return res.status(status).json(data);
    });

  var p = [];
  var maxResults = 100;
  let issues = [];

  for (let i = 0; i < total / maxResults; i++) {
    const payload = {
      expand: [""],
      jql: jqlString,
      maxResults: maxResults,
      fieldsByKeys: false,
      startAt: i * maxResults
    };
    p[i] = axios(options("POST", "search", payload, jiraUrl));
  }
  await Promise.all(p)
    .then(valArray => {
      valArray.map(res => {
        issues = issues.concat(res.data.issues);
      });
    })
    .catch(error => {
      const { status, data } = error.response;
      return res.status(status).json(data);
    });
  if (authors.length) worklogs = worklogs.filter(worklog => authors.includes(worklog.author.displayName));
  worklogs = worklogs.filter(worklog => issues.findIndex(issue => issue.id == worklog.issueId) != -1);
  worklogs.sort((a, b) => {
    let compareName = a.author.displayName.localeCompare(b.author.displayName);
    if (compareName === 0) {
      return moment(a.started).diff(moment(b.started));
    } else {
      return compareName;
    }
  });
  worklogs = worklogs.map(worklog => {
    let issue = issues.find(issue => issue.id == worklog.issueId);
    return {
      issueKey: issue.key,
      summary: issue.fields.summary,
      ...worklog
    };
  });
  return res.json(worklogs);
};

const options = (method, endPoint, payload, jiraUrl) => ({
  method: method,
  url: `${jiraUrl}/rest/api/3/${endPoint}`,
  auth: { username: username, password: apiToken },
  data: payload ? payload : undefined,
  headers: {
    Accept: "application/json"
  }
});

const convertToJqlString = filters => {
  var filtersJql = [];
  Object.entries(filters).map(([key, val]) => {
    if (val.length || val != '') {
      var jqlVal = "";
      val.forEach((item, index) => {
        if (index === 0) {
          jqlVal += key == "id" ? item : `"${item}"`;
        } else {
          jqlVal += key == "id" ? `,${item}` : `,"${item}"`;
        }
      });
      filtersJql.push(`${key} in (${jqlVal})`);
    }
  });
  return filtersJql.join(" AND ");
};

const getSumUserWorkDaysByProject = async (req, res) => {
  const { since, until, jiraUrl, projectName, workDay } = req.body;
  let query = `?since=${since}`;

  let worklogIds = [];
  let nextPage = "";
  do {
    await axios(
      options(
        "GET",
        nextPage ? `worklog/updated?since=${nextPage.substring(nextPage.length - 13)}` : `worklog/updated${query}`,
        false,
        jiraUrl
      )
    )
      .then(response => {
        worklogIds = worklogIds.concat(response.data.values.map(worklog => worklog.worklogId));

        if (response.data.nextPage) {
          nextPage = response.data.nextPage;
        } else {
          nextPage = "";
        }
      })
      .catch(error => {
        const { status, data } = error.response;
        return res.status(status).json(data);
      });
  } while (nextPage);
  let worklogs = [];
  let startIndex = 0;
  let endIndex = 1000;
  let callCount = 0;
  do {
    await axios(options("POST", "worklog/list", { ids: worklogIds.slice(startIndex, endIndex) }, jiraUrl))
      .then(response => {
        worklogs = worklogs.concat(response.data);
        startIndex += 1000;
        endIndex += 1000;
        callCount++;
      })
      .catch(error => {
        const { status, data } = error.response;
        return res.status(status).json(data);
      });
  } while (callCount < worklogIds.length / 1000);
  worklogs = worklogs.filter(
    worklog => moment(worklog.started).valueOf() > since && moment(worklog.started).valueOf() < until
  );
  let { filters } = req.body;
  filters.id = worklogs.map(worklog => worklog.issueId);
  let jqlString = convertToJqlString(filters);
  let data;
  let total;
  await axios(options("POST", "search", { jql: jqlString, maxResults: 0 }, jiraUrl))
    .then(response => {
      data = response.data;
      total = data.total;
    })
    .catch(error => {
      const { status, data } = error.response;
      return res.status(status).json(data);
    });

  var p = [];
  var maxResults = 100;
  let issues = [];

  for (let i = 0; i < total / maxResults; i++) {
    const payload = {
      expand: [""],
      jql: jqlString,
      maxResults: maxResults,
      fieldsByKeys: false,
      startAt: i * maxResults
    };
    p[i] = axios(options("POST", "search", payload, jiraUrl));
  }
  await Promise.all(p)
    .then(valArray => {
      valArray.map(res => {
        issues = issues.concat(res.data.issues);
      });
    })
    .catch(error => {
      const { status, data } = error.response;
      return res.status(status).json(data);
    });
  
  worklogs = worklogs.filter(worklog => issues.findIndex(issue => issue.id == worklog.issueId) != -1);
  
  worklogs.sort((a, b) => {
    let compareName = a.author.displayName.localeCompare(b.author.displayName);
    if (compareName === 0) {
      return moment(a.started).diff(moment(b.started));
    } else {
      return compareName;
    }
  });
  worklogs = worklogs.map(worklog => {
    return {
      projectName: projectName,
      workDay: workDay,
      ...worklog
    };
  });
  return res.json(worklogs);
};

module.exports = {
  getUserWorklogs,
  getSumUserWorkDaysByProject
};
