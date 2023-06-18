exports.up = function (knex, Promise) {
  return knex.schema.createTable("asset", function (t) {
    t.increments("id").primary();
    t.string("asset_code").notNull();
    t.integer("asset_type_id").notNull();
    t.integer("created_id").notNull();
    t.string("asset_info").notNull();
    t.string("asset_info_vn").notNull();
    t.integer("purpose_id").notNull();
    t.string("status").notNull();
    t.integer("manager_id").notNull().defaultTo(-1);
    t.string("note").notNull();
    t.integer("company_id").notNull();
    t.text("qr_code").notNull();
    t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();
  });
};

exports.down = function (knex, Promise) {
  return knex.schema.dropTable("asset");
};
