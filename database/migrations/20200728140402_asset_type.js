exports.up = function (knex, Promise) {
  return knex.schema.createTable("asset_type", function (t) {
    t.increments("id").primary();
    t.string("asset_type_code").notNull();
    t.string("asset_type_name").notNull();
    t.integer("created_id").notNull();
    t.integer("count").notNull().defaultTo(0);
    t.boolean("delete_flag").notNull().defaultTo(false);
    t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();
  });
};

exports.down = function (knex, Promise) {
  return knex.schema.dropTable("asset_type");
};
