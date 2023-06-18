const CronJob = require("cron").CronJob;
const axios = require("axios");
const table = require("markdown-table");
var width = require("string-width");
const ManageInternLeader = require("../../../repository/postgres-repository/manage-intern-leader.repository");
const logger = require("../../../utils/logger.js")(__filename);

const sendSlack = async () => {
  let res = await ManageInternLeader.getTimeWorkToSendSlack();
  for (var i = 0; i < res.length; i++) {
    team = res[i];
    try {
      let names = Object.keys(team.timeWork);
      if (team.urlslack && names.length) {
        let mTable = [];
        let dataHeader1 = ["------------", "------", "------", "------", "------", "------", "------", "------"];
        mTable.push(dataHeader1);
        let dataHeader = ["Thứ", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", " CN "];

        mTable.push(dataHeader);
        names.forEach(name => {
          let row = formatTime(team.timeWork[name]);
          row.unshift(team.timeWork[name][0]);
          mTable.push(row);
        });
        let markdownTable = table(mTable, { padding: true, stringLength: width, align: "c" });
        let arrayRows = markdownTable.split("\n");
        markdownTable = arrayRows.slice(2).join("\n");
        const payload = {
          blocks: [
            {
              type: "section",
              fields: [
                {
                  type: "mrkdwn",
                  text: `Time work of team`
                }
              ]
            },
            {
              type: "divider"
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "```" + markdownTable + "```"
              }
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "❌:Nghỉ     " + "🔺: Sáng    " + "🔻: Chiều   " + "✔️: Cả ngày "
              }
            }
          ]
        };

        await axios.post(team.urlslack, payload);
      }
    } catch {
      console.log("URL Webhook Slack incorrect");
      continue;
    }
  }
};

const formatTime = times => {
  let row = [];
  for (let i = 1; i <= 7; i++) {
    if (times[i] == undefined) row.push("❌");
    else if (times[i] == 0) row.push("🔺");
    else if (times[i] == 1) row.push("🔻");
    else row.push("✔️");
  }
  return row;
};

module.exports = async () => {
  const job = new CronJob("00 00 09 * * 1", async function () {
    logger.debug("Time intern work cron...");
    await sendSlack();
    logger.debug("Cron-job: Push notification slack Time intern work");
  });
  job.start();
};
