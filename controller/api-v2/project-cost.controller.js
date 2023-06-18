const Formatter = require("response-format");
const APIErrorWithKnex = require("../../utils/APIException/APIErrorWithKnex");
const ProjectCostRepository = require("../../repository/postgres-repository/project-cost.repository");
const knex = require("../../config/database");
const e = require("express");

module.exports.getListProjectCostByRole = async (req, res, next) => {
  // Updated: Try demo for error handling with knex error
  try {
    let listProjectCostByRole = await ProjectCostRepository.getListProjectCostByRole();
    res.json(Formatter.success(null, listProjectCostByRole));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.updateProjectCostByRole = async (req, res) => {
  let { id, role, project, cost, unit_cost, other_cost } = req.body;
  try {
    let newRecord = await ProjectCostRepository.upsertProjectCost(id, role, project, cost, unit_cost, other_cost);
    res.json(Formatter.success("update_project_cost_successfully", newRecord));
  } catch (error) {
    console.error(error);
    res.json(Formatter.badRequest("Role already exists", null));
  }
};

module.exports.deleteProjectCostByRole = async (req, res) => {
  const { id } = req.params;
  try {
    let newRecord = await ProjectCostRepository.deleteProjectCost(id);
    res.json(Formatter.success("delete_project_cost_successfully", newRecord));
  } catch (error) {
    console.error(error);
    res.json(Formatter.badRequest());
  }
};

module.exports.createProjectCostByRole = async (req, res) => {
  let { id, role, project, cost, unit_cost, other_cost } = req.body;
  try {
    let newRecord = await ProjectCostRepository.upsertProjectCost(id, role, project, cost, unit_cost, other_cost);
    res.json(Formatter.success("create_project_cost_successfully", newRecord));
  } catch (error) {
    console.error(error);
    res.json(Formatter.badRequest("Role already exists", null));
  }
};

module.exports.expandUserWorklog = async (req, res) => {
  const jiraUserWorklogData = [...req.body];
  try {
    let jiraEmails = jiraUserWorklogData.map(w => w.jiraEmail);
    let project = jiraUserWorklogData[0].project;
    let projectKey = jiraUserWorklogData[0].project_key;
    let linkedJiraEmails = await knex.select(
      knex.raw(` 
        "user"."jira_email"   as "jiraEmail"
      from "task"
      inner join "user_project" on "task"."id" = "user_project"."project_id"
      inner join "user" on "user"."id" = "user_project"."user_id"
      where "task"."delete_flag" = false
      and "user"."jira_email" in (${jiraEmails.map(e => "'" + e + "'").join(",")})
      and ("task"."name" = '${project}' or "task"."key" = '${projectKey}')
      `)
    );
    if (!linkedJiraEmails.length)
      res.json(
        Formatter.badRequest(
          "Members of this project have not been configured with proper Jira emails in the Task Managment page!"
        )
      );
    else {
      const listAdditionData = [];
      for (let index = 0; index < jiraUserWorklogData.length; index++) {
        let userWorklog = jiraUserWorklogData[index];
        let additionData = await ProjectCostRepository.getProjectCostByJiraData(
          userWorklog.project,
          userWorklog.project_key,
          userWorklog.jiraEmail
        );
        if (!additionData.length) console.error("Cannot expand data: ", userWorklog);
        else {
          userWorklog = Object.assign({}, userWorklog, additionData[0]);
          listAdditionData.push(userWorklog);
        }
      }
      if (!listAdditionData.length)
        res.json(Formatter.badRequest("Cost of each role in this project has not been configured properly!"));
      else res.json(Formatter.success(null, listAdditionData));
    }
  } catch (error) {
    console.error(error);
    res.json(Formatter.badRequest("No data!"));
  }
};

module.exports.updateCostByInvoiceId = async (req, res) => {
  try {
    let record = await ProjectCostRepository.updateCostByInvoiceId(req.body);
    res.json(Formatter.success(null, record));
  } catch (error) {
    console.error(error);
    res.json(Formatter.badRequest());
  }
};

module.exports.getProjectCostByProjectId = async (req, res) => {
  const { id } = req.params;
  try {
    let record = await ProjectCostRepository.getProjectCostByProjectId(id);
    res.json(Formatter.success(null, record));
  } catch (error) {
    console.error(error);
    res.json(Formatter.badRequest());
  }
};

module.exports.getListUserRoleProject = async (req, res) => {
  const { project_id } = req.query;
  try {
    let listRecord = await ProjectCostRepository.getListUserRoleProjectByProjectId(project_id);
    res.json(Formatter.success(null, listRecord));
  } catch (error) {
    console.error(error);
    res.json(Formatter.badRequest());
  }
};

module.exports.createNewUserRoleProject = async (req, res) => {
  const { id, project_id, role_project_id, user_id, jiraEmail } = req.body;
  try {
    let newRecord = await ProjectCostRepository.upsertUserRoleProject(id, project_id, role_project_id, user_id, jiraEmail);
    res.json(Formatter.success(null, newRecord));
  } catch (error) {
    console.error(error);
    res.json(Formatter.badRequest());
  }
};

module.exports.createNewUserJira = async (req, res) => {
  const { id, project_id, role_project_id, user_id, jiraEmail } = req.body;
  try {
    let newRecord = await ProjectCostRepository.upsertUserJira(id, project_id, role_project_id, user_id, jiraEmail);
    res.json(Formatter.success(null, newRecord));
  } catch (error) {
    console.error(error);
    res.json(Formatter.badRequest());
  }
};

module.exports.updateUserRoleProject = async (req, res) => {
  const { id, project_id, role_project_id, user_id, jira_email } = req.body;
  try {
    let newRecord = await ProjectCostRepository.upsertUserRoleProject(id, project_id, role_project_id, user_id, jira_email);
    res.json(Formatter.success(null, newRecord));
  } catch (error) {
    console.error(error);
    res.json(Formatter.badRequest());
  }
};

module.exports.deleteUserRoleProject = async (req, res) => {
  const { id } = req.params;
  try {
    let newRecord = await ProjectCostRepository.deleteUserRoleProject(id);
    res.json(Formatter.success(null, newRecord));
  } catch (error) {
    console.error(error);
    res.json(Formatter.badRequest());
  }
};
