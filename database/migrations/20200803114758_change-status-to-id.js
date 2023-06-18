exports.up = function (knex, Promise) {
  return knex.schema.alterTable("asset_history", function (t) {
    // t.integer("status_id_before");
    // t.integer("status_id_after");
  });
};

exports.down = function (knex) {};
