const { sendMailUserWorklog } = require("./modules/user-worklog");
const { workingPerformanceByDate } = require("./modules/working-performance-by-date");
const sendInternTimeWork = require("./modules/time-work-intern");
const { cronSendTaskReports } = require("./modules/task-report");
const { notification } = require("./modules/notification")

exports.start = () => {
  if (process.env.TIME_CRON) {
    sendMailUserWorklog();
    workingPerformanceByDate();
    sendInternTimeWork();
  }
  if (process.env.TIME_CRON_ISSUES && process.env.SLACK_TOKEN) cronSendTaskReports();
  notification()
};
