exports.up = function (knex, Promise) {
  return knex.schema.createTable("status", function (t) {
    t.increments("id").primary();
    t.string("name").unique();
  });
};

exports.down = function (knex, Promise) {
  return knex.schema.dropTable("status");
};
