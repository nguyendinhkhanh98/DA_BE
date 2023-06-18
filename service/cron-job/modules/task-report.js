const CronJob = require("cron").CronJob;
const axios = require("axios");
const moment = require("moment");
const knex = require("../../../config/database");
const _ = require("lodash");
const { pushSlack } = require("../../slack/index");
const username = process.env.JIRA_USERNAME;
const apiToken = process.env.API_TOKEN;
const JiraProjectRepository = require("../../../repository/postgres-repository/jira-project.repository");
const logger = require("../../../utils/logger.js")(__filename);

const cronSendTaskReports = async () => {
  const job = new CronJob(process.env.TIME_CRON_ISSUES, sendTaskReportsToSlack);
  job.start();
};

const sendTaskReportsToSlack = async function () {
  let allProjects = await getAllProjects();
  let allIssues = await getIssues(allProjects);
  let projectsToReport = await getProjectsToReport(allProjects);

  try {
    for (let i = 0; i < projectsToReport.length; i++) {
      let key = projectsToReport[i].key;
      let name = projectsToReport[i].name;
      let channelID = projectsToReport[i].channelID;
      if (name) {
        let payload = getSlackPayload(allIssues[key], name);
        let splitPayloads = getSplitSlackPayloads(payload);
        for (let j = 0; j < splitPayloads.length; j++) {
          let options = {
            method: "POST",
            url: `https://slack.com/api/chat.postMessage`,
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${process.env.SLACK_TOKEN}`
            },
            data: { channel: channelID, ...splitPayloads[j] }
          };
          await axios(options);
        }
      }
    }
  } catch (error) {
    logger.error(error);
  }
};

const getSplitSlackPayloads = payload => {
  let payloads = [];
  while (payload.blocks.length > 0) {
    let pl = {
      blocks: payload.blocks.splice(0, 50)
    };
    payloads.push(pl);
  }
  return payloads;
};

const getSlackPayload = (issues, projectName) => {
  let dueTodayIssues = issues.filter(i => i.duedate == moment().format("YYYY-MM-DD"));

  let payload = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${projectName} Project Report - ${moment().format("LL")}`,
          emoji: true
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Due today*: ${dueTodayIssues.length} issue${dueTodayIssues.length == 1 ? "" : "s"}`
        }
      }
    ]
  };

  if (dueTodayIssues.length)
    payload.blocks = payload.blocks.concat({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `The following issue${dueTodayIssues.length == 1 ? " is" : "s are"} due today:`
        }
      ]
    });

  dueTodayIssues.forEach((i, index) => {
    payload.blocks = payload.blocks.concat(getIssueUIBlocks(i, true));
  });

  let overdueIssues = issues.filter(i => i.duedate != moment().format("YYYY-MM-DD"));

  payload.blocks = payload.blocks.concat({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*Overdue*: ${overdueIssues.length} issue${overdueIssues.length == 1 ? "" : "s"}`
    }
  });
  if (overdueIssues.length)
    payload.blocks = payload.blocks.concat({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `The following issue${overdueIssues.length == 1 ? " is" : "s are"} overdue:`
        }
      ]
    });

  overdueIssues.forEach((i, index) => {
    payload.blocks = payload.blocks.concat(getIssueUIBlocks(i, index != overdueIssues.length - 1));
  });

  return payload;
};

const getIssueUIBlocks = (issue, shouldBuildDivider) => {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<${issue.url}|*${issue.key} ${issue.summary}*>`
      }
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Status: *${issue.status}*`
        },
        {
          type: "image",
          image_url: issue.avatarUrl,
          alt_text: issue.assignee
        },
        {
          type: "mrkdwn",
          text: `Assignee: *${issue.assignee}*`
        }
      ]
    },
    {
      type: "divider"
    }
  ].filter(b => (shouldBuildDivider ? true : b.type != "divider"));
};

const getIssues = async allProjects => {
  let allIssues = [];
  for (const project of allProjects) {
    let issues = await searchIssueByJql(project.url, getPayload(project.projects.map(p => p.key)));
    allIssues = allIssues.concat(issues.issues);
  }
  allIssues = _.groupBy(allIssues, "fields.project.key");
  const noAvatarURL =
    "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/557058:e6727e9e-7ebc-4e85-9a57-074ffe884af8/6090f82a-e5b8-44de-8d25-d25a74749475/25";
  for (const projectKey in allIssues) {
    allIssues[projectKey] = allIssues[projectKey].map(i => ({
      key: i.key,
      summary: i.fields.summary,
      status: i.fields.status.name,
      assignee: i.fields.assignee?.displayName ?? "Unassigned",
      duedate: i.fields.duedate,
      url: i.self.substr(0, i.self.indexOf(".net") + 4) + `/browse/${i.key}`,
      avatarUrl: i.fields.assignee ? i.fields.assignee.avatarUrls["24x24"] : noAvatarURL
    }));
  }
  return allIssues;
};

const getAllProjects = async () => {
  let jiraURLs = await JiraProjectRepository.getListJiraProject();
  let allURLs = jiraURLs.map(p => p.url);

  let allProjects = [];
  for (const url of allURLs) {
    let prjs = await getAllProjectsFromURL(url);
    let projectsWithURL = {
      url: prjs[0].self.substr(0, prjs[0].self.indexOf(".net") + 4),
      projects: prjs.map(p => ({ key: p.key, name: p.name }))
    };
    allProjects.push(projectsWithURL);
  }

  return allProjects;
};

const getPayload = projectKeys => ({
  expand: [],
  jql: `project in (${projectKeys
    .map(k => "'" + k + "'")
    .join()}) AND sprint in openSprints() AND duedate <= startOfDay(-0d) AND resolution = unresolved`,
  maxResults: 1000,
  fieldsByKeys: false,
  fields: ["summary", "status", "assignee", "duedate", "project"],
  startAt: 0
});

const searchIssueByJql = async (url, payload) => {
  let options = {
    method: "POST",
    url: `${url}/rest/api/3/search`,
    auth: { username: username, password: apiToken },
    headers: {
      Accept: "application/json"
    },
    data: payload
  };
  const { data } = await axios(options);
  return data;
};

const getAllProjectsFromURL = async url => {
  var options = {
    method: "GET",
    url: `${url}/rest/api/3/project/search?expand=url`,
    auth: { username: username, password: apiToken },
    headers: {
      Accept: "application/json"
    }
  };
  let response = await axios(options);
  return response.data.values.filter(item => !item.isPrivate);
};

const getProjectsToReport = async allProjects => {
  let projectsToReport = await knex("project_report_schedule").select("key", "channelID");
  let projects = [];
  for (let i = 0; i < allProjects.length; i++) {
    projects = projects.concat(allProjects[i].projects);
  }
  return projectsToReport.map(pk => ({ ...pk, name: projects.find(p => p.key == pk.key)?.name ?? "" }));
};

const getAvailableChannels = async (req, res) => {
  if (!process.env.SLACK_TOKEN) {
    res.json("Environment variable 'SLACK_TOKEN' was not properly configured on the server!");
    return;
  }
  let allRequests = [];
  let getChannels = {
    method: "GET",
    url: `https://slack.com/api/conversations.list?types=public_channel,private_channel`,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${process.env.SLACK_TOKEN}`
    }
  };
  allRequests.push(axios(getChannels));
  let getUsers = {
    method: "GET",
    url: `https://slack.com/api/users.list`,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${process.env.SLACK_TOKEN}`
    }
  };
  allRequests.push(axios(getUsers));
  let response = await Promise.all(allRequests);

  let availableChannels = [];
  for (let i = 0; i < response.length; i++) {
    let arr = response[i].data["channels"]
      ? response[i].data["channels"]
      : response[i].data["members"].filter(u => u.id != "USLACKBOT" && !u.is_bot);
    availableChannels = availableChannels.concat(
      arr.map(c => ({
        id: c.id,
        name: c.name,
        avatarUrl: c.is_private === true ? "lock" : c.is_private === false ? "#" : c.profile["image_24"]
      }))
    );
  }

  return res.json(availableChannels);
};

const setProjectChannelIDs = async (req, res) => {
  let projectKeysWithChannelIDs = req.body;
  try {
    await knex("project_report_schedule").del();
    await knex("project_report_schedule").insert(projectKeysWithChannelIDs);
    res.json("success");
  } catch (error) {
    logger.error(error);
    res.json(error);
  }
};

const getSavedConfig = async (req, res) => {
  let config = await knex("project_report_schedule");
  res.json(config);
};

module.exports = { cronSendTaskReports, getAvailableChannels, setProjectChannelIDs, getSavedConfig };
