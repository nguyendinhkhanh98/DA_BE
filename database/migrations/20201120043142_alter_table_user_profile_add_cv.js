exports.up = function (knex) {
  return knex.schema.alterTable("user_profile", function (t) {
    t.text("cv");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("user_profile", function (t) {
    t.dropColumn("cv");
  });
};
