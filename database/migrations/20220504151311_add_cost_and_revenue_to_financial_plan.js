exports.up = function (knex) {
  return knex.schema.alterTable("financial_plan", function (t) {
    t.float("planned_cost");
    t.float("planned_revenue");
    t.float("actual_cost");
    t.float("actual_revenue");
    t.timestamp("last_updated").defaultTo(knex.fn.now()).notNull();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("financial_plan", function (t) {
    t.dropColumn("planned_cost");
    t.dropColumn("planned_revenue");
    t.dropColumn("actual_cost");
    t.dropColumn("actual_revenue");
    t.dropColumn("last_updated");
  });
};
