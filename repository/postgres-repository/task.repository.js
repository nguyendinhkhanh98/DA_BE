const knex = require("../../config/database.js");

module.exports.getAllLinkedTasks = () => {
  return knex("task").select("id", "name", "key").whereRaw("key IS NOT NULL");
};

module.exports.getUserRolesByTaskIds = taskIds => {
  return knex("user")
    .rightJoin("user_project", "user.id", "user_project.user_id")
    .leftJoin("role_project", "user_project.role_project_id", "role_project.id")
    .leftJoin("task", "user_project.project_id", "task.id")
    .select("user.jira_email", "task.key", "role_project.name as role")
    .whereIn("project_id", taskIds);
};

module.exports.getTaskById = id => {
  return knex("task").select("*").where("id", "=", id);
};
