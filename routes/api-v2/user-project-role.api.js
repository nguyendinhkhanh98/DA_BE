const express = require("express");
const router = express.Router();
const guard = require("express-jwt-permissions")();
const UserProjectRoleController = require("../../controller/api-v2/user-project-role.controller");
const permissions = [["admin"]];

router
  .route("/user-project-role/:id")
  .get(guard.check(permissions), UserProjectRoleController.getUserProjectRoles)
  .post(guard.check(permissions), UserProjectRoleController.addUserProjectRole)
  .put(guard.check(permissions), UserProjectRoleController.updateUserProjectRole)
  .delete(guard.check(permissions), UserProjectRoleController.deleteUserProjectRole);

module.exports = router;
