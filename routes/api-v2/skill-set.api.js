const express = require("express");
const router = express.Router();
const SkillSetControllerV2 = require("../../controller/api-v2/skill-set.controller");
const guard = require("express-jwt-permissions")();
const permissions = [["admin"]];

router.get("/skill-set/list-user-period-compare", SkillSetControllerV2.getListUserPeriodCompare);
router.post("/skill-set/source-user-compare", SkillSetControllerV2.getSkillSetBySourceUserCompare);

router.route("/skill-set/tags").get(SkillSetControllerV2.getListTag).post(SkillSetControllerV2.createSkillTag);
router
  .route("/skill-set/tags/:id")
  .get(SkillSetControllerV2.getSkillTagById)
  .put(SkillSetControllerV2.editSkillTag)
  .delete(SkillSetControllerV2.deleteSkillTag);

router.get(
  "/skill-set/latest-assessment-approved",
  guard.check(permissions),
  SkillSetControllerV2.getLatestAssessmentApproved
);

module.exports = router;
