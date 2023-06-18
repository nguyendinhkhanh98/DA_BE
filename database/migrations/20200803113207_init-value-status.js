exports.up = function (knex, Promise) {
  return knex.schema.alterTable("asset", function (t) {
    t.integer("status_id").defaultTo(1);
  });
};

exports.down = function (knex) {};
