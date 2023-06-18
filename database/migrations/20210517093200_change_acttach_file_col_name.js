exports.up = function (knex) {
  return knex.schema.alterTable("user_task_history", function (t) {
    t.renameColumn("file_attack", "attachment");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("user_task_history", function (t) {
    t.renameColumn("file_attack", "attachment");
  });
};
