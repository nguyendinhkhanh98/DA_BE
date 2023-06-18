exports.up = async knex => {
  //   Drop constrains to project table
  const user_project = knex.schema.table("user_project", table => {
    table.dropForeign("project_id");
  });
  const invoice_project = knex.schema.table("invoice_project", table => {
    table.dropForeign("project_id");
  });
  const project_role_cost = knex.schema.table("project_role_cost", table => {
    table.dropForeign("project_id");
  });

  // Remove all data of task table
  await knex("task_skill").truncate();
  await knex("task_business_skill").truncate();
  await knex("user_task_history").truncate();
  await knex.raw("TRUNCATE TABLE task CASCADE");

  return Promise.all([user_project, invoice_project, project_role_cost]);
};

exports.down = function (knex) {};
