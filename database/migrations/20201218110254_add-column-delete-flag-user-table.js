exports.up = function (knex, Promise) {
  return knex.schema.alterTable("user", function (t) {
    t.boolean("delete_flag").notNull().defaultTo(false);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("user", function (t) {
    t.dropColumn("delete_flag");
  });
};
