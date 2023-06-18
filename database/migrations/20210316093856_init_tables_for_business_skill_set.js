exports.up = function (knex) {
  const business_levels = knex.schema.createTable("business_levels", function (t) {
    t.increments("id").primary();
    t.specificType("level", "serial");
    t.string("name").unique();
    t.text("description");
    t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();
  });

  const busieness_user_period = knex.schema.createTable("business_user_period", function (t) {
    t.increments("id").primary();
    t.integer("period_id").notNull();
    t.integer("user_id").notNull();
    t.integer("leader_id").notNull();
    t.string("status");

    t.foreign("period_id").references("period.id");
    t.foreign("user_id").references("user.id");
    t.foreign("leader_id").references("user.id");
    t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();
  });

  const business_skill_set = knex.schema.createTable("business_skill_set", function (t) {
    t.increments("id").primary();
    t.integer("user_period_id").notNull();
    t.integer("business_skill_id").notNull();
    t.integer("experience_time");
    t.integer("level");
    t.integer("level_review");
    t.string("note");

    t.unique(["user_period_id", "business_skill_id"]);
    t.foreign("user_period_id").references("business_user_period.id");
    t.foreign("business_skill_id").references("business_skill.id");
    t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();
  });

  const insertLevel = knex("business_levels").insert([
    { name: "L0", description: "No knowledge or no experience" },
    { name: "L1", description: "Has knowledge" },
    { name: "L2", description: "Can be done with support, or has experience" },
    { name: "L3", description: "Can be done on your own or has experience" },
    { name: "L4", description: "Can or has experience in teaching others" }
  ]);

  return Promise.all([business_levels, busieness_user_period, business_skill_set, insertLevel]);
};

exports.down = function (knex) {
  const business_levels = knex.schema.dropTable("business_levels");
  const busieness_user_period = knex.schema.dropTable("business_user_period");
  const business_skill_set = knex.schema.dropTable("business_skill_set");

  return Promise.all([business_skill_set, busieness_user_period, business_levels]);
};
