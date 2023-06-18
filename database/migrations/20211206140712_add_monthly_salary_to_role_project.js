exports.up = function (knex) {
  return knex.schema.alterTable("role_project", function (t) {
    t.float("monthly_salary");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("role_project", function (t) {
    t.dropColumn("monthly_salary");
  });
};
