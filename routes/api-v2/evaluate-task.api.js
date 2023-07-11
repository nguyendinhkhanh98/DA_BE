const express = require("express");
const router = express.Router();
const guard = require("express-jwt-permissions")();
const BusinessCategoryController = require("../../controller/api-v2/business-skill-category.controller");
const BusinessSkillController = require("../../controller/api-v2/business-skill.controller");
const TaskController = require("../../controller/api-v2/business-task.controller");
const EvaluateTaskController = require("../../controller/api-v2/evaluate-task.controller")
const permissions = [["admin"]];
const multer = require("multer");
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, process.env.FILE_DIRECTORY);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});
var upload = multer({ storage: storage });

router
  .route("/evaluate-task")
  .get(guard.check(permissions), EvaluateTaskController.getAllEvaluateTask)

module.exports = router;
