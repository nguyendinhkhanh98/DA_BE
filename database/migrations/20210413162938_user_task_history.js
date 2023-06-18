exports.up = knex => {
  const user_task_history = knex.schema.createTable("user_task_history", t => {
    t.increments("id").primary();
    t.integer("user_id").notNull();
    t.integer("task_id").notNull();
    t.date("start_date").notNull();
    t.date("end_date");
    t.text("comment");
    t.foreign("user_id").references("user.id");
    t.foreign("task_id").references("task.id");
    t.unique(["user_id", "task_id", "start_date"]);
  });
  // const task = knex.schema.table("task", table => {
  //   table.dropUnique("name");
  // });
  return Promise.all([user_task_history]);
};

exports.down = knex => {
  return knex.schema.dropTable("user_task_history");
};
