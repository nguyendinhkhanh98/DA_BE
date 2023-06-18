exports.up = function (knex) {
  return knex.schema.createTable("jira_project", function (t) {
    t.increments("id").primary();
    t.string("name").unique().notNull();
    t.string("url").unique().notNull();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("jira_project");
};
