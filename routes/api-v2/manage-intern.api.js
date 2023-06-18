const express = require("express");
const router = express.Router();
const ManageInternController = require("../../controller/api-v2/manage-intern.controller");
const guard = require("express-jwt-permissions")();

const leaderRole = [["admin"], ["leader"], ["manager"]];
const teamsRole = [["admin"], ["leader"]];

router.post("/get-timeworkofteam", guard.check(leaderRole), ManageInternController.getTimeWorkOfTeam);
router.get("/get-list-intern", guard.check(teamsRole), ManageInternController.getListIntern);
router.post("/del-intern-from-team", guard.check([["leader"]]), ManageInternController.delInternFromTeam);
router.post("/search-user", guard.check([["leader"]]), ManageInternController.searchUser);
router.post("/add-intern-to-team", guard.check([["leader"]]), ManageInternController.addInternToTeam);
router.get("/get-salaries", guard.check(leaderRole), ManageInternController.getSalaries);
router.post("/search-intern-to-add-salary", guard.check(leaderRole), ManageInternController.searchInternToAddSalary);
router.post("/add-salary-for-intern", guard.check(leaderRole), ManageInternController.addSalaryForIntern);
router.post("/get-salary-history", guard.check(teamsRole), ManageInternController.getSalaryHistory);
router.post("/update-salary-of-intern", guard.check(teamsRole), ManageInternController.updateSalary);
router.post("/update-link-slack", guard.check([["leader"]]), ManageInternController.updateLinkSlack);
router.post("/delete-salary", guard.check(teamsRole), ManageInternController.deleteSalary);

router.post("/update-time-work-intern", guard.check(teamsRole), ManageInternController.updateTimeWorkIntern);
router.delete("/delete-time-work-intern/:id", guard.check(teamsRole), ManageInternController.deleteTimeWorkIntern);

module.exports = router;
