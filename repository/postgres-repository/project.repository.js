const knex = require("../../config/database.js");

module.exports.upsertProject = async ({ id, name, delete_flag }) => {
  let isCreate = ["add", null, undefined].includes(id);

  if (!isCreate) return knex("project").update({ name, delete_flag }).where({ id });
  return knex("project").insert({ name }).returning("*");
};

module.exports.getListProjectATV = () => {
  return knex("task").select().orderBy("name");
};

module.exports.deprecateATVProjectById = id => {
  return knex("project").update({ delete_flag: true }).where({ id });
};

module.exports.getProjectByProjectId = id => {
  return knex("task").select().where({ id }).orderBy("name");
};

module.exports.getProjectByCondition = condition => {
  return knex("task").select().where(condition);
};
