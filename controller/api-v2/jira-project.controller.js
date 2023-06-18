const Formatter = require("response-format");
const JiraProjectRepository = require("../../repository/postgres-repository/jira-project.repository");
const logger = require("../../utils/logger.js")(__filename);

const getListJiraProject = async (req, res) => {
  let listJiraProject = await JiraProjectRepository.getListJiraProject();
  res.json(Formatter.success(null, listJiraProject));
};

const deleteUserById = async (req, res) => {
  const { id } = req.params;
  try {
    await JiraProjectRepository.deleteJiraProject(id);
    res.json(Formatter.success("jira_project_004_delete_successfully", null));
  } catch (error) {
    logger.error(error);
    res.json(Formatter.badRequest());
  }
};

const updateJiraProjectById = async (req, res) => {
  const { id } = req.params;
  const { name, url } = req.body;
  try {
    await JiraProjectRepository.updateJiraProject(id, name, url);
    res.json(Formatter.success("jira_project_003_update_successfully", null));
  } catch (error) {
    logger.error(error);
    res.json(Formatter.badRequest("error_data_duplicate", null));
  }
};

const createNewJiraProject = async (req, res) => {
  const { name, url } = req.body;
  try {
    let newProject = await JiraProjectRepository.createNewJiraProject(name, url);
    res.json(Formatter.success("jira_project_001_create_project_successfully", newProject[0]));
  } catch (error) {
    logger.error(error);
    res.json(Formatter.badRequest("error_data_duplicate", null));
  }
};

const updateSortOrder = async (req, res) => {
  const { projects } = req.body;

  try {
    for (let index = 0; index < projects.length; index++) {
      const element = projects[index];
      await JiraProjectRepository.updateJiraProject(element.id, element.name, element.url, index + 1);
    }
    res.json(Formatter.success("jira_project_002_update_sort_order_successfully", null));
  } catch (error) {
    logger.error(error);
    res.json(Formatter.badRequest());
  }
};

module.exports = {
  getListJiraProject,
  createNewJiraProject,
  updateJiraProjectById,
  deleteUserById,

  updateSortOrder
};
