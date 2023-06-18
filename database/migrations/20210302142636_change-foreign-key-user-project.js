exports.up = async function (knex) {
  await knex.schema.table("user_project", function (t) {
    t.dropPrimary();
  });

  await knex.schema.alterTable("user_project", function (t) {
    t.increments().primary();
    t.integer("role_project_id");
    t.unique(["role_project_id", "user_id", "project_id"]);

    t.foreign("role_project_id").references("role_project.id");
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("user_project", function (t) {
    t.dropUnique(
      ["role_project_id", "user_id", "project_id"],
      "user_project_role_project_id_user_id_project_id_unique"
    );
    t.dropColumn("id");
    t.dropColumn("role_project_id");
  });

  await knex.schema.alterTable("user_project", function (t) {
    t.primary(["user_id", "project_id"]);
  });
};
