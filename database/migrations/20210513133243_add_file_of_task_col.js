exports.up = function (knex) {
  return knex.schema.alterTable("user_task_history", function (t) {
    t.text("file_attack");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("user_task_history", function (t) {
    t.text("file_attack");
  });
};
