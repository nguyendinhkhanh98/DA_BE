exports.up = function (knex) {
  return knex.schema.createTable("project_role_cost", function (t) {
    t.specificType("id", "serial");
    t.integer("role_id");
    t.integer("project_id");
    t.float("cost");

    t.foreign("role_id").references("role.id");
    t.foreign("project_id").references("project.id");
    t.primary(["role_id", "project_id"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("project_role_cost");
};
