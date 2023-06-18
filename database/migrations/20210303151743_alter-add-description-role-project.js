exports.up = function (knex) {
  return knex.schema.alterTable("role_project", function (t) {
    t.text("description");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("role_project", function (t) {
    t.dropColumn("description");
  });
};
