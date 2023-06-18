exports.up = function (knex) {
  return knex.schema.createTable("role_project", function (t) {
    t.increments("id").primary();
    t.string("name").unique();
    t.boolean("delete_flag").notNull().defaultTo(false);
    t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("role_project");
};
