const _ = require("lodash");
const axios = require("axios");
const username = process.env.JIRA_USERNAME;
const apiToken = process.env.API_TOKEN;
const logger = require("../../utils/logger.js")(__filename);

let getProjectByJiraURLAndKey = async (jiraUrl, key) => {
  let options = {
    method: "GET",
    url: `${jiraUrl}/rest/api/3/project/search?keys=${key}`,
    auth: { username: username, password: apiToken },
    headers: {
      Accept: "application/json"
    }
  };
  let response = await axios(options);
  let projects = response.data.values.filter(item => !item.isPrivate);
  return projects[0];
};

module.exports = {
  getProjectByJiraURLAndKey
};
