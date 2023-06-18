const express = require("express");
const router = express.Router();
const ManageCalendarController = require("../../controller/api-v2/manage-work-calendar.controller");

router.post("/save-timedraft", ManageCalendarController.saveTimeDraft);
router.post("/get-timedraft", ManageCalendarController.getTimeDraft);
router.post("/save-timeWork", ManageCalendarController.saveTimeWork);
router.post("/get-timework", ManageCalendarController.getTimeWork);

module.exports = router;
