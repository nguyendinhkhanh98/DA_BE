exports.up = function (knex) {
  const time_work_draft = knex.schema.createTable("time_work_draft", function (t) {
    t.integer("internid").notNull();
    t.timestamp("start").notNull();
    t.integer("value");
    t.primary(["internid", "start"]);
    t.foreign("internid").references("user.id").onDelete();
  });
  const time_work = knex.schema.createTable("time_work", function (t) {
    t.integer("internid").notNull();
    t.timestamp("start").notNull();
    t.integer("value");
    t.primary(["internid", "start"]);
    t.foreign("internid").references("user.id").onDelete();
  });
  const teams = knex.schema.createTable("teams", function (t) {
    t.increments("id").primary();
    t.integer("leaderid").notNull();
    t.text("urlslack");
    t.foreign("leaderid").references("user.id").onDelete();
  });
  const user_of_team = knex.schema.createTable("user_of_team", function (t) {
    t.integer("internid");
    t.integer("teamid");
    t.timestamp("start");
    t.primary(["internid", "teamid"]);
    t.foreign("internid").references("user.id").onDelete();
    t.foreign("teamid").references("teams.id").onDelete();
  });
  const salary = knex.schema.createTable("salary", function (t) {
    t.integer("internid");
    t.timestamp("updateat");
    t.integer("salaryaday");
    t.primary("internid");
    t.foreign("internid").references("user.id").onDelete();
  });
  const historysalary = knex.schema.createTable("historysalary", function (t) {
    t.integer("internid");
    t.timestamp("updateat");
    t.integer("salaryaday");
    t.text("month");
    t.primary(["internid", "month"]);
    t.foreign("internid").references("user.id").onDelete();
  });

  return Promise.all([time_work_draft, time_work, teams, user_of_team, salary, historysalary]);
};

exports.down = function (knex) {
  const time_work_draft = knex.schema.dropTable("time_work_draft");
  const time_work = knex.schema.dropTable("time_work");
  const teams = knex.schema.dropTable("teams");
  const user_of_team = knex.schema.dropTable("user_of_team");
  const salary = knex.schema.dropTable("salary");
  const historysalary = knex.schema.dropTable("historysalary");
  return Promise.all([time_work_draft, time_work, user_of_team, teams, salary, historysalary]);
};
