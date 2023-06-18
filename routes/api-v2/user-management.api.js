const express = require("express");
const router = express.Router();
const guard = require("express-jwt-permissions")();
const UserManagementControllerV2 = require("../../controller/api-v2/user-management.controller");
const permissions = [["admin"], ["manager"]];

router.get("/user-management/list-leader", UserManagementControllerV2.getListLeader);
router.get("/user-management/list-all-user", guard.check(permissions), UserManagementControllerV2.getAllUser);

router.get("/user-management/list-all-user-project", guard.check(permissions), UserManagementControllerV2.getAllUserProject);

router.post("/user-management/restore-user", guard.check(permissions), UserManagementControllerV2.restoreUserById);
router.post("/user-management/roles", guard.check(permissions), UserManagementControllerV2.createNewRole);
router
  .route("/user-management/role/:id")
  .post(guard.check(permissions), UserManagementControllerV2.updateRoleById)
  .delete(guard.check(permissions), UserManagementControllerV2.deprecateRoleById)
  .put(guard.check(permissions), UserManagementControllerV2.restoreRoleById);

router
  .route("/user-management/projects")
  .get(UserManagementControllerV2.getListProjectATV)
  .post(guard.check(permissions), UserManagementControllerV2.createNewATVProject);
router
  .route("/user-management/projects/:id")
  .get(guard.check([["admin"]]), UserManagementControllerV2.getProjectByProjectId)
  .put(guard.check(permissions), UserManagementControllerV2.updateProjectById)
  .delete(guard.check(permissions), UserManagementControllerV2.deprecateATVProjectById);
module.exports = router;
