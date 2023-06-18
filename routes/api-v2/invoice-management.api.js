const express = require("express");
const router = express.Router();
const guard = require("express-jwt-permissions")();
const InvoiceController = require("../../controller/api-v2/invoice-management.controller");
const permissions = [["admin"]];

router.route("/invoice-management/invoices").post(guard.check(permissions), InvoiceController.createInvoiceProject);
router
  .route("/invoice-management/invoices/:id")
  .get(guard.check(permissions), InvoiceController.getListInvoiceByProjectId)
  .post(guard.check(permissions), InvoiceController.updateInvoiceByProjectId)
  .delete(guard.check(permissions), InvoiceController.deleteInvoiceByInvoiceId);

router.route("/invoice-management/status").get(guard.check(permissions), InvoiceController.getListInvoiceStatus);
router.route("/invoice-management/projects").get(guard.check(permissions), InvoiceController.getListInvoiceProject);

module.exports = router;
