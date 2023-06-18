exports.up = function (knex, Promise) {
  return knex.schema.alterTable("user_profile", function (t) {
    t.text("position");
    t.text("about");
    t.text("interested_project");
    t.text("project_description");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("user_profile", function (t) {
    t.dropColumn("position");
    t.dropColumn("about");
    t.dropColumn("interested_project");
    t.dropColumn("project_description");
  });
};
