exports.up = function (knex) {
  return knex.schema.createTable("financial_plan", t => {
    t.increments("id").primary();
    t.integer("task_id").notNull();
    t.string("name").notNull();
    t.date("start_date").notNull();
    t.date("end_date").notNull();
    t.foreign("task_id").references("task.id");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("financial_plan");
};
