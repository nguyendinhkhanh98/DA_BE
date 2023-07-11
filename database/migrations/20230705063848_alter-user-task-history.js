/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  const createTableNotificationRemindWork = knex.schema.hasTable("notification").then(function (exists) {
    if (!exists) {
      return knex.schema.createTable("notification", function (t) {
        t.increments("id").primary();
        t.integer("user_id").notNull();
        t.text("content");
        t.enu("type", ['assign', 'deadline']).defaultTo('new')
        t.boolean('isRead')
        t.enu('level', [1, 2, 3])

        t.foreign("user_id").references("user.id");
        t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();
      });
    }
  });
  
  const alterUserTaskHistory = knex.schema.alterTable("user_task_history", function (t) {
    t.enu("status", ['new', 'working', 'done']).defaultTo('new');
    t.timestamp("updated_at").defaultTo(knex.fn.now()).notNull();
    t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();
  });

  return Promise.all([
    createTableNotificationRemindWork,
    alterUserTaskHistory
  ])
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  const dropUserTaskHistory = knex.schema.alterTable("user_task_history", function (t) {
    t.dropColumn("status");
    t.dropColumn("updated_at");
  });
  const dropTableNotification = knex.schema.dropTable("notification");
  return Promise.all([
    dropUserTaskHistory,
    dropTableNotification
  ])
};
