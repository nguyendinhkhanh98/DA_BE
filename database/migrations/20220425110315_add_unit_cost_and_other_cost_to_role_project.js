exports.up = function (knex) {
  return knex.schema.alterTable("role_project", function (t) {
    t.float("unit_cost");
    t.float("other_cost");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("role_project", function (t) {
    t.dropColumn("unit_cost");
    t.dropColumn("other_cost");
  });
};
