exports.up = function(knex) {
  return knex.schema.alterTable("user_project", function (t) {
    t.string("jira_email")
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable("user_project", function (t) {
    t.dropColumn("jira_email");
  })
};