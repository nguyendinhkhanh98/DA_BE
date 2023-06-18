exports.up = function (knex) {
  const task_status = knex.schema.createTable("task_status", function (t) {
    t.increments("id").primary();
    t.string("name").unique().notNull();
  });

  const task = knex.schema.createTable("task", function (t) {
    t.increments("id").primary();
    t.string("name").notNull();
    t.string("description");
    t.integer("status_id");
    t.boolean("delete_flag").notNull().defaultTo(false);
    t.timestamp("started_at").defaultTo(knex.fn.now()).notNull();
    t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();

    t.foreign("status_id").references("task_status.id");
  });

  const task_skill = knex.schema.createTable("task_skill", function (t) {
    t.increments("id").primary();
    t.integer("task_id");
    t.integer("skill_id");

    t.foreign("task_id").references("task.id");
    t.foreign("skill_id").references("skill.id");
  });

  const task_business_skill = knex.schema.createTable("task_business_skill", function (t) {
    t.increments("id").primary();
    t.integer("task_id");
    t.integer("business_skill_id");

    t.foreign("task_id").references("task.id");
    t.foreign("business_skill_id").references("business_skill.id");
  });

  const init_task_status = knex("task_status").insert([{ name: "active" }, { name: "inactive" }]);

  return Promise.all([task_status, task, task_skill, task_business_skill, init_task_status]);
};

exports.down = function (knex) {
  const task_status = knex.schema.dropTable("task_status");
  const task = knex.schema.dropTable("task");
  const task_skill = knex.schema.dropTable("task_skill");
  const task_business_skill = knex.schema.dropTable("task_business_skill");

  return Promise.all([task_business_skill, task_skill, task, task_status]);
};
