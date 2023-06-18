exports.up = function (knex) {
  return knex.schema.createTable("financial_plan_role", t => {
    t.integer("plan_id").notNull();
    t.integer("role_id").notNull();
    t.float("quantity").notNull();
    t.unique(["plan_id", "role_id"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("financial_plan_role");
};
