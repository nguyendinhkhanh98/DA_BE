exports.up = function (knex) {
  return knex.schema.alterTable("invoice_project", function (t) {
    t.string("invoice_number");
  });
};

exports.down = function (knex) {};
