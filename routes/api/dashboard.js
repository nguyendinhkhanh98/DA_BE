const express = require("express");
const router = express.Router();
const DashboardController = require("../../controller/api/dashboard");

router.get("/sprint/active", DashboardController.getActiveSprints);
router.get("/users/search", DashboardController.getAllUsersInfo);

router.get("/working-performance", DashboardController.getWorkingPerformance);
router.get("/task/status", DashboardController.getStatusOfTheTask);
router.get("/user/worklog", DashboardController.getUserWorklog);

router.get("/user/change-log-issue", DashboardController.getChangeLogIssue);

module.exports = router;
