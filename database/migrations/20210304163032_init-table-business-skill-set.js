exports.up = function (knex) {
  const business_skill_category = knex.schema.createTable("business_skill_category", function (t) {
    t.increments("id").primary();
    t.string("name").unique().notNull();
    t.string("description");
    t.specificType("sort", "serial");
    t.boolean("delete_flag").notNull().defaultTo(false);
    t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();
  });

  const business_skill = knex.schema.createTable("business_skill", function (t) {
    t.increments("id").primary();
    t.integer("category_id");
    t.string("name").unique().notNull();
    t.string("description");
    t.boolean("delete_flag").notNull().defaultTo(false);
    t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();

    t.foreign("category_id").references("business_skill_category.id");
  });
  return Promise.all([business_skill_category, business_skill]);
};

exports.down = function (knex) {
  const business_skill = knex.schema.dropTable("business_skill");
  const business_skill_category = knex.schema.dropTable("business_skill_category");
  return Promise.all([business_skill, business_skill_category]);
};
