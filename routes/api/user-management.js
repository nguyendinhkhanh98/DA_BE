const express = require("express");
const router = express.Router();
const multer = require("multer");
const UserController = require("../../controller/api/user-management");
const { createUserValidator } = require("../../middleware/validator/user-management");
const guard = require("express-jwt-permissions")();
const upload = multer({ dest: "./assets/CV" });
const permissions = [["admin"], ["manager"]];

router.get("/user-management", guard.check(permissions), UserController.getUserList);
router.get("/user-management/name-only", UserController.getFullNameUser);
router.get("/user-management/name-and-email", UserController.getUserWithNameAndEmail);
router.get("/user-management/project", UserController.getProjectList);

router.post(
  "/user-management",
  guard.check(permissions),
  createUserValidator(),
  upload.single("cv"),
  UserController.createNewUser
);
router.get("/user-management/role", guard.check(permissions), UserController.getRoleList);
router.get("/user-management/:id", guard.check(permissions), UserController.findUserById);
router.put("/user-management/:id", guard.check(permissions), upload.single("cv"), UserController.updateUserById);
router.delete("/user-management/:id", guard.check(permissions), UserController.deleteUserById);

module.exports = router;
