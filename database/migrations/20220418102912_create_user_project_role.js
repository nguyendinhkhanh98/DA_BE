exports.up = function (knex) {
  return knex.schema.createTable("user_project_role", t => {
    t.increments("id").primary();
    t.integer("user_id").notNull();
    t.integer("role_id").notNull();
    t.integer("task_id").notNull();
    t.date("start_date").notNull();
    t.date("end_date");
    t.text("comment");
    t.foreign("user_id").references("user.id");
    t.foreign("task_id").references("task.id");
    t.foreign("role_id").references("role_project.id");
    t.unique(["user_id", "task_id", "start_date"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("user_project_role");
};
