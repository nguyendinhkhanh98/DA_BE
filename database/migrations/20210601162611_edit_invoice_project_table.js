exports.up = function (knex) {
  const dropDateCol = knex.schema.alterTable("invoice_history", function (t) {
    t.dropColumn("start_date");
    t.dropColumn("end_date");
  });
  const addDateCol = knex.schema.alterTable("invoice_project", function (t) {
    t.string("start_date");
    t.string("end_date");
    t.string("due_date");
  });
  return Promise.all([dropDateCol, addDateCol]);
};

exports.down = function (knex) {};
