exports.up = function (knex, Promise) {
  return knex.schema.createTable("purpose", function (t) {
    t.increments("id").primary();
    t.string("name").notNull();
  });
};

exports.down = function (knex, Promise) {
  return knex.schema.dropTable("purpose");
};
