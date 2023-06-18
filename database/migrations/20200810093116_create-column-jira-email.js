exports.up = function (knex, Promise) {
  return knex.schema.alterTable("user", function (t) {
    t.string("jira_email");
  });
};

exports.down = function (knex) {};
