exports.up = function(knex) {
  return knex.schema.createTable("user_work_log", t => {
    t.increments("id").primary();
    t.integer("user_id").notNull();
    t.integer("project_id").notNull();
    t.float("actual_work_day");
    t.integer("month").notNull();

    t.foreign("user_id").references("user.id");
    t.foreign("project_id").references("task.id");
    t.unique(["user_id", "project_id", "month"]);
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable("user_work_log");
};
