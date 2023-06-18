exports.up = function (knex) {
  const levelSkill = knex.schema.alterTable("task_skill", function (t) {
    t.integer("level_required");
  });

  const levelBusinessSkill = knex.schema.alterTable("task_business_skill", function (t) {
    t.integer("level_required");
  });

  return Promise.all([levelSkill, levelBusinessSkill]);
};

exports.down = function (knex) {
  const levelSkill = knex.schema.alterTable("task_skill", function (t) {
    t.dropColumn("level_required");
  });

  const levelBusinessSkill = knex.schema.alterTable("task_business_skill", function (t) {
    t.dropColumn("level_required");
  });

  return Promise.all([levelSkill, levelBusinessSkill]);
};
