exports.up = function (knex) {
  const level0 = knex("business_levels").update({ level: 0 }).where({ name: "L0" });
  const level1 = knex("business_levels").update({ level: 1 }).where({ name: "L1" });
  const level2 = knex("business_levels").update({ level: 2 }).where({ name: "L2" });
  const level3 = knex("business_levels").update({ level: 3 }).where({ name: "L3" });
  const level4 = knex("business_levels").update({ level: 4 }).where({ name: "L4" });

  return Promise.all([level0, level1, level2, level3, level4]);
};

exports.down = function (knex) {
  const level0 = knex("business_levels").update({ level: 1 }).where({ name: "L0" });
  const level1 = knex("business_levels").update({ level: 2 }).where({ name: "L1" });
  const level2 = knex("business_levels").update({ level: 3 }).where({ name: "L2" });
  const level3 = knex("business_levels").update({ level: 4 }).where({ name: "L3" });
  const level4 = knex("business_levels").update({ level: 5 }).where({ name: "L4" });

  return Promise.all([level0, level1, level2, level3, level4]);
};
