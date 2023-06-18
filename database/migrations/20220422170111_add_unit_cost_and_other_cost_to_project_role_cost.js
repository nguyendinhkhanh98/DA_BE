exports.up = function (knex) {
  return knex.schema.alterTable("project_role_cost", function (t) {
    t.float("unit_cost").defaultTo(0);
    t.float("other_cost").defaultTo(0);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("project_role_cost", function (t) {
    t.dropColumn("unit_cost");
    t.dropColumn("other_cost");
  });
};
