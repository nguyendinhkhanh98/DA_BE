exports.up = function (knex) {
  return knex.schema.createTable("time_off_work_history", function (t) {
    t.increments("id").primary();
    t.integer("user_id");
    t.string("type");
    t.integer("manager_id");
    t.date("date_created").defaultTo(knex.fn.now());
    t.text("reason");
    t.json("data");
    t.string("status");
    t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();

    t.foreign("user_id").references("user.id");
    t.foreign("manager_id").references("user.id");
    t.unique(["user_id", "date_created", "type"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("time_off_work_history");
};
