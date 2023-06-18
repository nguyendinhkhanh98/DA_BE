const express = require("express");
const router = express.Router();
const IssueController = require("../../controller/api/summary-report-by-issue");

// Project
router.get("/project", IssueController.getAllProject);
router.get("/issue/status", IssueController.getAllStatusesProject);
router.get("/issue/user/assignable", IssueController.getUsersAssignable);
router.get("/issue/user-project/assignable", IssueController.getUsersAssignableInProject);
// router.get("/issue/email/assignable", IssueController.getAllJiraEmailInProject)

router.get("/issue/createmeta", IssueController.getAllIssueTypes);
router.get("/sprint", IssueController.getAllSprint);

// Issue
router.post("/issue", IssueController.getIssueList);
router.post("/issue/type-for-chart", IssueController.getTypeIssueListForChart);
router.post("/issue/count", IssueController.getCountIssueList);
router.post("/issue/export", IssueController.exportJiraQcdReport);
router.post("/issue/origin-data/export", IssueController.exportOriginData);
router.post("/issue/qcd-kpi", IssueController.getQCD_KPI);
router.post("/export/qcd-pdf", IssueController.exportQCDToPDF);

module.exports = router;
