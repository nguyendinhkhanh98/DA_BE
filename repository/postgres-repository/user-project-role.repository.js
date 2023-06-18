const knex = require("../../config/database.js");

module.exports.addUserProjectRole = (user_id, role_id, task_id, start_date, end_date, comment) => {
  return knex("user_project_role").insert({ user_id, role_id, task_id, start_date, end_date, comment }).returning("*");
};

module.exports.getUserProjectRoles = task_id => {
  return knex.raw(`select upr.id, up.full_name, upr.user_id, upr.role_id, upr.start_date, upr.end_date, rp.name, upr.comment from user_project_role upr join "user_profile" up on upr.user_id = up.id
  join role_project rp on upr.role_id = rp.id
  join task t on upr.task_id = t.id where task_id = ${task_id} order by upr.id`);
};

module.exports.updateUserProjectRole = (id, user_id, role_id, task_id, start_date, end_date, comment) => {
  return knex("user_project_role")
    .where("id", "=", id)
    .update({ user_id, role_id, task_id, start_date, end_date, comment })
    .returning("*");
};

module.exports.deleteUserProjectRole = id => {
  return knex("user_project_role").where("id", "=", id).delete().returning("*");
};
