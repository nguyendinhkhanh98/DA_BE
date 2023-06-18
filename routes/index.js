const router = require("express").Router();

router.use("/api", require("./api/auth"));
router.use("/api", require("./api/summary-report-by-issue"));
router.use("/api", require("./api/worklog-detail-by-user"));
router.use("/api", require("./api/worklog-summary-by-user"));
router.use("/api", require("./api/worklog-by-issue"));
router.use("/api", require("./api/user-management"));
router.use("/api", require("./api/asset-management"));
router.use("/api", require("./api/profile"));
router.use("/api", require("./api/dashboard"));
router.use("/api", require("./api/skill-set"));

router.use("/api/v2", require("./api-v2/qcd-report.api"));
router.use("/api/v2", require("./api-v2/dashboard.api"));
router.use("/api/v2", require("./api-v2/register-calendar.api"));
router.use("/api/v2", require("./api-v2/manage-intern.api"));
router.use("/api/v2", require("./api-v2/off-work-management.api"));
router.use("/api/v2", require("./api-v2/user-management.api"));
router.use("/api/v2", require("./api-v2/jira-project.api"));
router.use("/api/v2", require("./api-v2/skill-set.api"));
router.use("/api/v2", require("./api-v2/project-cost.api"));
router.use("/api/v2", require("./api-v2/role-project.api"));
router.use("/api/v2", require("./api-v2/invoice-management.api"));
router.use("/api/v2", require("./api-v2/document-management.api"));
router.use("/api/v2", require("./api-v2/business-skill-set.api"));
router.use("/api/v2", require("./api-v2/slack-integration.api"));
router.use("/api/v2", require("./api-v2/user-project-role.api"));
router.use("/api/v2", require("./api-v2/financial-plan.api"));
router.use("/api/v2", require("./api-v2/user-work-day.api"));

module.exports = router;
