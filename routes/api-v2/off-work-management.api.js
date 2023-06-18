const express = require("express");
const router = express.Router();
const OffWorkController = require("../../controller/api-v2/off-work-management.controller");

router.route("/off-work").get(OffWorkController.getOffWorkHistoryInMonth).post(OffWorkController.createRecordOffWork);
router.route("/off-work/range").get(OffWorkController.getOffWorkHistoryByRange);

router.route("/off-work/status").get(OffWorkController.getListStatus).put(OffWorkController.changeStatus);
router.get("/off-work/latest-manager", OffWorkController.getLatestManager);

module.exports = router;
