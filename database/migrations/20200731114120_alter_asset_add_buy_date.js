exports.up = function (knex, Promise) {
  return knex.schema.alterTable("asset", function (t) {
    t.timestamp("buy_date").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {};
