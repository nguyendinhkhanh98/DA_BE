const express = require("express");
const router = express.Router();
const WorklogController = require("../../controller/api/worklog-detail-by-user");

router.post("/get-user-worklogs", WorklogController.getUserWorklogs);
router.post("/get-sum-user-workdays-by-project", WorklogController.getSumUserWorkDaysByProject);

module.exports = router;
