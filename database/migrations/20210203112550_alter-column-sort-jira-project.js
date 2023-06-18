exports.up = function (knex) {
  return knex.schema.alterTable("jira_project", function (t) {
    t.specificType("sort", "serial");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("jira_project", function (t) {
    t.dropColumn("sort");
  });
};
