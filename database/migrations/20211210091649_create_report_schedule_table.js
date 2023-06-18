exports.up = function (knex) {
  return knex.schema.createTable("project_report_schedule", function (t) {
    t.string("key").notNull();
    t.string("channelID").notNull();
    t.primary(["key", "channelID"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("project_report_schedule");
};
