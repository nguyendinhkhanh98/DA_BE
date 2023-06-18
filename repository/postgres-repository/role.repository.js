const knex = require("../../config/database.js");

module.exports.upsertRole = async ({ id, name, delete_flg }) => {
  let isCreate = ["add", null, undefined].includes(id);

  if (!isCreate) return knex("role").update({ name, delete_flg }).where({ id });
  return knex("role").insert({ name }).returning("*");
};

module.exports.deprecateRoleById = async id => {
  return knex("role").update({ delete_flg: true }).where({ id });
};

module.exports.restoreRoleById = async id => {
  return knex("role").update({ delete_flg: false }).where({ id });
};

module.exports.getListRoleOrderByName = () => {
  return knex.select().from("role").orderBy("name");
};
