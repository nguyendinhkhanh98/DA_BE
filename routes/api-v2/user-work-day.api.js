const express = require("express");
const router = express.Router();
const guard = require("express-jwt-permissions")();
const UserWorkDayControllerV2 = require("../../controller/api-v2/user-work-log.controller");
const permissions = [["admin"], ["manager"]];

router
  .route("/get-user-actual-working-day")
  .get(guard.check([permissions]), UserWorkDayControllerV2.saveUserWorkdaysByProjectInMonth);

router
  .get("/notification", UserWorkDayControllerV2.getAllNotificationByUserId)
  .put("/notification", UserWorkDayControllerV2.putAllNotificationByUserId)

module.exports = router;