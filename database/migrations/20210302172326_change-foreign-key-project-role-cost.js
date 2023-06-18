exports.up = async function (knex) {
  await knex("project_role_cost").truncate();
  await knex.schema.table("project_role_cost", function (t) {
    t.dropForeign("role_id");
  });

  await knex.schema.table("project_role_cost", function (t) {
    t.foreign("role_id").references("role_project.id");
  });
};

exports.down = async function (knex) {
  await knex.schema.table("project_role_cost", function (t) {
    t.dropForeign("role_id");
  });

  await knex.schema.table("project_role_cost", function (t) {
    t.foreign("role_id").references("role.id");
  });
};
