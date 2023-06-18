const express = require("express");
const router = express.Router();
const guard = require("express-jwt-permissions")();
const worklogReport = require("../../service/cron-job/modules/user-worklog");
const taskReport = require("../../service/cron-job/modules/task-report.js");
const permissions = [["admin"]];

router.route("/slack-integration/push-worklog").post(guard.check(permissions), worklogReport.sendWorklogTableToSlack);
router.route("/slack-integration/channels").get(guard.check(permissions), taskReport.getAvailableChannels);
router.route("/slack-integration/channels").post(guard.check(permissions), taskReport.setProjectChannelIDs);
router.route("/slack-integration/issue-config").get(guard.check(permissions), taskReport.getSavedConfig);

module.exports = router;
