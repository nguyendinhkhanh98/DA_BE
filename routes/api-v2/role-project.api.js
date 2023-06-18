const express = require("express");
const router = express.Router();
const guard = require("express-jwt-permissions")();
const RoleProjectController = require("../../controller/api-v2/role-project.controller");
const permissions = [["admin"]];
router
  .route("/roles-project")
  .get(RoleProjectController.getListRoleProject)
  .post(guard.check(permissions), RoleProjectController.createRoleProject);

router.route("/roles-project/:id").put(guard.check(permissions), RoleProjectController.updateRoleProject);

module.exports = router;
