const express = require("express");
const router = express.Router();
const { changePasswordValidator } = require("../../middleware/validator/change-password");
const { sendMailUserWorklog } = require("../../service/cron-job/modules/user-worklog");
const AuthController = require("../../controller/api/auth");

router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);
router.post("/password/change", changePasswordValidator(), AuthController.changePassword);
router.post("/password/forgot", AuthController.forgotPassword);
router.post("/password/reset", AuthController.resetPassword);
router.get("/test", sendMailUserWorklog);

module.exports = router;
