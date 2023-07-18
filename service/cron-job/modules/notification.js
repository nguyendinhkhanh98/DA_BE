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

const notification = async () => {
  const job = new CronJob('0 0 0 * * *', async function() {
    const listUserTaskHistoryInDay = await knex("user_task_history")
      .select('*')
      .where('end_date', ">=", moment().startOf('day'))
      .where('end_date', "<=", moment().endOf('day'))
      .leftJoin('task', 'task.id', 'user_task_history.task_id')
    for(const item of listUserTaskHistoryInDay) {
      await knex("notification")
      .insert({ user_id: item?.user_id, content: `Bạn có deadline công việc hôm nay (${moment(item?.end_date).format("DD/MM/YYYY")}) trong project ${item?.name}`, type: "deadline", isRead: false })
    }
  });
  job.start();
};

module.exports = { notification }