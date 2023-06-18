exports.up = function (knex, Promise) {
  return knex.schema.createTable("asset_history", function (t) {
    t.increments("id").primary();
    t.integer("asset_id");
    t.integer("user_change_id");
    t.string("type");
    t.string("comment");
    t.integer("status_id_before");
    t.integer("status_id_after");
    t.integer("manager_id_before");
    t.integer("manager_id_after");
    t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();
  });
};

exports.down = function (knex, Promise) {
  return knex.schema.dropTable("asset_history");
};
