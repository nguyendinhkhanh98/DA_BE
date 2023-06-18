exports.up = function (knex) {
  return knex.schema.alterTable("task", function (t) {
    t.string("key");
    t.string("jira_url");
    t.string("jira_id");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("task", function (t) {
    t.dropColumn("key");
    t.dropColumn("jira_url");
    t.dropColumn("jira_id");
  });
};
