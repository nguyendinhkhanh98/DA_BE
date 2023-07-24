const express = require("express");
const router = express.Router();
const guard = require("express-jwt-permissions")();
const BusinessCategoryController = require("../../controller/api-v2/business-skill-category.controller");
const BusinessSkillController = require("../../controller/api-v2/business-skill.controller");
const TaskController = require("../../controller/api-v2/business-task.controller");
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
  .route("/business-skill-set/categories")
  .get(guard.check(permissions), BusinessCategoryController.getBusinessSkillCategories)
  .post(guard.check(permissions), BusinessCategoryController.createBusinessSkillCategory)
  .put(guard.check(permissions), BusinessSkillController.updateCategoryBusinessSkill);
router
  .route("/business-skill-set/categories/:id")
  .get(guard.check(permissions), BusinessCategoryController.getBusinessSkillCategory)
  .post(guard.check(permissions), BusinessCategoryController.updateBusinessSkillCategoryById)
  .delete(guard.check(permissions), BusinessCategoryController.removeCategoryOfBusinessSkill);

router
  .route("/business-skill-set/skills")
  .get(BusinessSkillController.getAllBusinessSkill)
  .post(guard.check(permissions), BusinessSkillController.createBusinessSkill);
router
  .route("/business-skill-set/skills/:id")
  .post(guard.check(permissions), BusinessSkillController.updateBusinessSkill)
  .put(guard.check(permissions), BusinessSkillController.restoreBusinessSkill)
  .delete(guard.check(permissions), BusinessSkillController.archiveBusinessSkill);

router
  .route("/business-skill-set/tasks")
  .get(guard.check([["admin"], ["manager"], ["leader"], ["developer"], ["tester"]]), TaskController.getAllTask)
  .post(guard.check(permissions), TaskController.createTask);
router
  .route("/business-skill-set/tasks/:id")
  .get(guard.check([["admin"], ["manager"], ["leader"], ["developer"], ["tester"]]), TaskController.getTask)
  .post(guard.check(permissions), TaskController.updateTask)
  .put(guard.check(permissions), TaskController.restoreTask)
  .delete(guard.check(permissions), TaskController.archiveTask);

router.get("/business-skill-set/task-status", guard.check([["admin"], ["manager"], ["leader"], ["developer"], ["tester"]]), TaskController.getAllTaskStatus);

router.get(
  "/business-skill-set/latest-assessment-approved",
  guard.check(permissions),
  TaskController.getLatestAssessmentApproved
);
//assessment business skill
router.get("/business-skill-set/skill-to-assessment", BusinessSkillController.getAllBusinessSkillToAssessment);
router.get("/business-skill-set/levels", BusinessSkillController.getBusinessLevels);
router
  .route("/business-skill-set/assessment")
  .post(BusinessSkillController.createAssessment)
  .put(BusinessSkillController.updateAssessment);
router.get("/business-skill-set/period", BusinessSkillController.getAvaiablePeriod);
router.get("/business-skill-set/user-period", BusinessSkillController.getAllAssessment);
router.get("/business-skill-set/user-period/:user_period_id", BusinessSkillController.getAssessmentInfo);
router.get(
  "/business-skill-set/user-period/skill-of-assessment/:user_period_id",
  BusinessSkillController.getAssessmentSkills
);

// Task history
router
  .route("/business-skill-set/task-history")
  .get(TaskController.getAllHistoryByTaskId)
  .post(TaskController.addOrCreateTaskHistory)
  .put(TaskController.addOrCreateTaskHistory)
  .delete(TaskController.removeTaskHistory);

router.get("/business-skill-set/task-history/view-all", TaskController.getAllMemberTaskHistory);

router.get("/business-skill-set/task-history-user", TaskController.getAllUserTaskHistoryByUserId);

// Attack File Management
router.post("/files", upload.single("file"), TaskController.uploadAttackFile);
router.get("/files/:path", TaskController.downAttackFile);
router.delete("/files/:path", TaskController.deleteAttackFile);

router.put("/business-skill-set/leader", BusinessSkillController.updateBusinessLeaderById);

router.post("/business-skill-set/sync", TaskController.syncTaskWithJiraProject);

module.exports = router;
