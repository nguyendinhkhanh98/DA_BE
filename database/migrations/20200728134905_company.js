exports.up = function (knex) {
  const createTable = knex.schema.createTable("company", function (t) {
    t.increments("id").primary();
    t.string("name").notNull();
    t.string("code").unique().notNull();
  });

  const initData = knex("company").insert([
    { code: "ATV", name: "Arrow Tech VN" },
    { code: "VTC", name: "VTC Company" },
    { code: "ATMV", name: "ATMV company" }
  ]);

  return Promise.all([createTable, initData]);
};

exports.down = function (knex) {
  return knex.schema.dropTable("company");
};
