const knex = require("../../config/database.js");

module.exports.getListRoleProject = () => {
  return knex("role_project").select().orderBy("name", "desc");
};

module.exports.upsertRoleProject = ({ id, name, delete_flag, description, monthly_salary, unit_cost, other_cost }) => {
  description = description ? description : null;
  let isCreate = ["add", null, undefined].includes(id);

  if (!isCreate)
    return knex("role_project")
      .update({ name, delete_flag, description, monthly_salary, unit_cost, other_cost })
      .where({ id });
  return knex("role_project").insert({ name, description, monthly_salary, unit_cost, other_cost }).returning("*");
};
