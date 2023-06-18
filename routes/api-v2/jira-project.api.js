const express = require("express");
const router = express.Router();
const JiraProjectController = require("../../controller/api-v2/jira-project.controller");

router
  .route("/jira-project/projects")
  .get(JiraProjectController.getListJiraProject)
  .post(JiraProjectController.createNewJiraProject);
router.route("/jira-project/sort-order").put(JiraProjectController.updateSortOrder);
router
  .route("/jira-project/projects/:id")
  .put(JiraProjectController.updateJiraProjectById)
  .delete(JiraProjectController.deleteUserById);

module.exports = router;
