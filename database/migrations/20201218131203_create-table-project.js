exports.up = function (knex) {
  const project = knex.schema.createTable("project", function (t) {
    t.increments("id").primary();
    t.string("name").unique().notNull();
    t.boolean("delete_flag").notNull().defaultTo(false);
    t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();
  });

  const user_project = knex.schema.createTable("user_project", function (t) {
    t.integer("user_id");
    t.integer("project_id");
    t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();

    t.foreign("user_id").references("user.id");
    t.foreign("project_id").references("project.id");
    t.primary(["user_id", "project_id"]);
  });
  return Promise.all([project, user_project]);
};

exports.down = function (knex) {
  const project = knex.schema.dropTable("project");
  const user_project = knex.schema.dropTable("user_project");
  return Promise.all([user_project, project]);
};
