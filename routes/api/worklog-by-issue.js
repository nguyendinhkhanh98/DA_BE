const express = require("express");
const router = express.Router();
const TimeSheetTaskController = require("../../controller/api/worklog-by-issue");

router.post("/time-sheet-task", TimeSheetTaskController.getTimeSheet);
router.post("/time-sheet-task/export", TimeSheetTaskController.exportTimeSheet);
router.post("/time-sheet-task/parent/export", TimeSheetTaskController.exportTimeSheetByParent);

module.exports = router;
