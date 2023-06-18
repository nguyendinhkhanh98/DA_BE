const express = require("express");
const router = express.Router();
const SkillSetController = require("../../controller/api/skill-set.js");
const guard = require("express-jwt-permissions")();
const permissions = [["admin"], ["manager"]];

router
  .route("/skill-set")
  .get(SkillSetController.FetchSkillSet)
  .post(SkillSetController.CreateSkillSet)
  .put(SkillSetController.UpdateSkillSet);
router
  .route("/skill-set/period")
  .get(SkillSetController.FetchPeriod)
  .post(guard.check(permissions), SkillSetController.CreatePeriod)
  .put(guard.check(permissions), SkillSetController.UpdatePeriod)
  .delete(guard.check(permissions), SkillSetController.DeletePeriod);
router.get("/skill-set/all-period", SkillSetController.getAllPeriod);
router.get("/skill-set/all-user", SkillSetController.getAllDevUser);
router.put("/skill-set/restore-period", SkillSetController.restorePeriod);
router
  .route("/skill-set/draft")
  .post(SkillSetController.CommitDraftSkillSet)
  .put(SkillSetController.UpdateDraftSkillSet);
router.route("/skill-set/reject").post(SkillSetController.RejectSkillSet);
router
  .route("/skill-set/category")
  .get(guard.check(permissions), SkillSetController.FetchCategory)
  .post(guard.check(permissions), SkillSetController.CreateCategory)
  .put(guard.check(permissions), SkillSetController.UpdateCategory)
  .delete(guard.check(permissions), SkillSetController.DeleteCategory);
router
  .route("/skill-set/skill")
  .get(SkillSetController.FetchSkill)
  .post(guard.check(permissions), SkillSetController.CreateSkill)
  .put(guard.check(permissions), SkillSetController.UpdateSkill);
router.get("/skill-set/skill-configure", SkillSetController.FetchSkillConfigure);

router.get("/skill-set/user-period/:user_period_id", SkillSetController.FetchPeriodByUserID);
router.get("/skill-set/levels", SkillSetController.FetchLevels);
router.post("/skill-set/export-lastest", SkillSetController.exportSkillSetSummaryLastest);
router.post("/skill-set/export-sumarry-by-user", SkillSetController.ExportSumarryByUser);

router.route("/skill-set/leader").put(SkillSetController.updateEngineerLeaderById);

module.exports = router;
