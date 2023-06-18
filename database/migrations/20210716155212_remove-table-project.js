exports.up = function (knex) {
  return knex.schema.dropTable("project");
};

exports.down = function (knex) {
  return knex.schema.createTable("project", function (t) {
    t.increments("id").primary();
    t.string("name").unique().notNull();
    t.boolean("delete_flag").notNull().defaultTo(false);
    t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();
  });
};
