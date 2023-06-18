const knex = require("../../config/database.js");

const getListJiraProject = () => {
  return knex("jira_project").select("*").orderBy("sort");
};

const deleteJiraProject = project_id => {
  return knex("jira_project").delete().where({ id: project_id });
};

const updateJiraProject = (id, name, url, sort) => {
  let paramUpdate = { name, url };
  if (sort) paramUpdate.sort = sort;

  return knex("jira_project").update(paramUpdate).where({ id });
};

const createNewJiraProject = (name, url) => {
  return knex("jira_project").insert({ name, url }).returning("*");
};

module.exports = {
  getListJiraProject,
  createNewJiraProject,
  updateJiraProject,
  deleteJiraProject
};
