exports.up = async knex => {
  await knex.schema.alterTable("user_task_history", function (t) {
    t.dropColumn("attachment");
  });
  return knex.schema.alterTable("user_task_history", function (t) {
    t.json("attachment");
  });
};

exports.down = function (knex) {};
