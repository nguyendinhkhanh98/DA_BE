exports.up = function (knex) {
  const skill_tag = knex.schema.createTable("skill_tag", function (t) {
    t.increments("id").primary();
    t.string("name").unique();
    t.string("color");
  });

  const foreign_tag = knex.schema.alterTable("skill", function (t) {
    t.json("tag");
  });

  return Promise.all([skill_tag, foreign_tag]);
};

exports.down = function (knex) {
  const skill_tag = knex.schema.dropTable("skill_tag");
  const foreign_tag = knex.schema.alterTable("skill", function (t) {
    t.dropColumn("tag");
  });

  return Promise.all([skill_tag, foreign_tag]);
};
