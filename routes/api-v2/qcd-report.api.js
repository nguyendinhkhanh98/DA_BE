const express = require("express");
const router = express.Router();
const QcdReportController = require("../../controller/api-v2/qcd-report.controller.js");

router.post("/qcd-report/kpi", QcdReportController.getQcdKpiReport);
router.post("/qcd-report/origin", QcdReportController.getQcdOriginReport);
router.post("/qcd-report/summary", QcdReportController.getQcdSummaryReport);
router.post("/qcd-report/bug-detail", QcdReportController.getListBugDetail);
router.post("/qcd-report/issues-over-estimate", QcdReportController.getListIssueOverEstimate);
router.post("/qcd-report/issues-over-duedate", QcdReportController.getListIssueOverDueDate);
router.post("/qcd-report/issues-degrate", QcdReportController.getListIssueHasDegrate);
router.post("/qcd-summary/summary-kpi", QcdReportController.getQcdSummaryKpiData);
router.post("/qcd-report/invoice", QcdReportController.getInvoiceReport);

module.exports = router;
