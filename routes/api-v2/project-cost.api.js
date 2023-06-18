const express = require("express");
const router = express.Router();
const guard = require("express-jwt-permissions")();
const ProjectCostController = require("../../controller/api-v2/project-cost.controller");
const permissions = [["admin"]];

router
  .route("/projects-cost")
  .get(ProjectCostController.getListProjectCostByRole)
  .post(guard.check(permissions), ProjectCostController.createProjectCostByRole);

router.route("/projects-cost/expand-user-worklog").post(ProjectCostController.expandUserWorklog);
router.route("/projects-cost/update-cost").put(ProjectCostController.updateCostByInvoiceId);

router
  .route("/projects-cost/:id")
  .get(guard.check(permissions), ProjectCostController.getProjectCostByProjectId)
  .post(guard.check(permissions), ProjectCostController.updateProjectCostByRole)
  .delete(guard.check(permissions), ProjectCostController.deleteProjectCostByRole);

router
  .route("/user-role-projects")
  .get(ProjectCostController.getListUserRoleProject)
  .post(guard.check(permissions), ProjectCostController.createNewUserRoleProject);

router
  .route("/user-role-projects/:id")
  .post(guard.check(permissions), ProjectCostController.updateUserRoleProject)
  .delete(guard.check(permissions), ProjectCostController.deleteUserRoleProject);

router
  .route("/user-jira")
  .post(guard.check(permissions), ProjectCostController.createNewUserJira);

module.exports = router;
