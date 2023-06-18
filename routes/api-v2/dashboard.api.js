const express = require("express");
const router = express.Router();
const DashboardController = require("../../controller/api-v2/dashboard.controller.js");

router.post("/dashboard/get-user-worklog-in-duration", DashboardController.getUserWorklogInDuration);

module.exports = router;
