const knex = require("../../config/database.js");

module.exports.getListProjectCostByRole = () => {
  return getBodyQueryProjectCost()
    .where({ "role_project.delete_flag": false, "project.delete_flag": false })
    .orderBy("project.name");
};

module.exports.upsertProjectCost = (id, role_id, project_id, cost, unit_cost, other_cost) => {
  let isCreate = ["add", null, undefined].includes(id);
  if (!isCreate)
    return knex("project_role_cost")
      .update({ role_id, project_id, cost, unit_cost, other_cost })
      .where({ id })
      .returning("*");
  return knex("project_role_cost").insert({ role_id, project_id, cost, unit_cost, other_cost }).returning("*");
};

module.exports.deleteProjectCost = id => {
  return knex("project_role_cost").delete().where({ id });
};

module.exports.getProjectCostByJiraData = (project, project_key, jira_email) => {
  let a = knex.select(
    knex.raw(` 
      "role_project"."name" as "role",
      "task"."name"       as "project",
      "user"."jira_email"   as "jiraEmail",
      "project_role_cost"."cost"
    from "project_role_cost"
    inner join "task" on "task"."id" = "project_role_cost"."project_id"
    inner join "role_project" on "role_project"."id" = "project_role_cost"."role_id"
    inner join "user_project" on "user_project".project_id = task.id and user_project.role_project_id = "project_role_cost"."role_id"
    inner join "user" on "user"."id" = "user_project"."user_id"
    where "role_project"."delete_flag" = false
    and "task"."delete_flag" = false
    and "user"."jira_email" = '${jira_email}'
    and ("task"."name" = '${project}' or "task"."key" = '${project_key}')
    order by "project_role_cost"."cost" desc
    `)
  );
  return a;
};

module.exports.getProjectCostByProjectId = projectId => {
  return getBodyQueryProjectCost()
    .where({ "role_project.delete_flag": false, "task.delete_flag": false, "task.id": projectId })
    .orderBy("task.name");
};

module.exports.getListUserRoleProjectByProjectId = project_id => {
  return knex("user_project").select().where({ project_id });
};

module.exports.upsertUserRoleProject = (id, project_id, role_project_id, user_id, jira_email) => {
  let isCreate = ["add", null, undefined].includes(id);
  if (!isCreate)
    return knex("user_project").update({ project_id, role_project_id, user_id, jira_email }).where({ id }).returning("*");
  return knex("user_project").insert({ project_id, role_project_id, user_id, jira_email }).returning("*");
};

module.exports.upsertUserJira = (id, project_id, role_project_id, user_id, jira_email) => {
  let isCreate = ["add", null, undefined].includes(id);
  if (!isCreate)
    return knex("user_project").update({ project_id, role_project_id, user_id, jira_email }).where({ id }).returning("*");
  return knex("user_project").insert({ project_id, role_project_id, user_id, jira_email }).returning("*");
};

module.exports.deleteUserRoleProject = id => {
  return knex("user_project").delete().where({ id });
};

module.exports.updateCostByInvoiceId = body => {
  return knex("invoice_project").update({ cost: body.cost }).where({ id: body.id }).returning("*");
};

const getBodyQueryProjectCost = () => {
  return knex("project_role_cost")
    .columns(
      { role: "role_project.name", project: "task.name" },
      "project_role_cost.cost",
      "project_role_cost.unit_cost",
      "project_role_cost.other_cost",
      "project_role_cost.id",
      "project_role_cost.role_id",
      "project_role_cost.project_id"
    )
    .select()
    .leftJoin("role_project", "role_project.id", "project_role_cost.role_id")
    .leftJoin("task", "task.id", "project_role_cost.project_id");
};
