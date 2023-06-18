const express = require("express");
const router = express.Router();
const TimeSheetUserController = require("../../controller/api/worklog-summary-by-user");

router.post("/time-sheet-user", TimeSheetUserController.getTimeSheetUser);
router.post("/arrow-all-project", TimeSheetUserController.getAllProjectArrow);
router.post("/worklog/user-in-company", TimeSheetUserController.getAllUserInCompany);
router.post("/monthly-report", TimeSheetUserController.exportMonthlyReport);

module.exports = router;
