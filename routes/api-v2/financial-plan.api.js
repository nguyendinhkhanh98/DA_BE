const express = require("express");
const router = express.Router();
const guard = require("express-jwt-permissions")();
const FinancialPlanController = require("../../controller/api-v2/financial-plan.controller");
const permissions = [["admin"]];

router
  .route("/financial-plan/:id")
  .get(guard.check(permissions), FinancialPlanController.getFinancialPlans)
  .post(guard.check(permissions), FinancialPlanController.addFinancialPlan)
  .put(guard.check(permissions), FinancialPlanController.updateFinancialPlan)
  .delete(guard.check(permissions), FinancialPlanController.deleteFinancialPlan);

module.exports = router;
