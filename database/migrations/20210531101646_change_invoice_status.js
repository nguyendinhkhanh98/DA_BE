exports.up = knex => {
  const drop_foreign_status = knex.schema.table("invoice_history", table => {
    table.dropForeign("status_id");
  });
  const del_invoice_status_data = knex.raw("TRUNCATE TABLE invoice_status CASCADE");
  const init_invoice_status = knex("invoice_status").insert([
    { id: 1, name: "Processing" },
    { id: 2, name: "Plan To Issue" },
    { id: 3, name: "Issued INVOICE" },
    { id: 4, name: "Payment Done" }
  ]);
  const addTimeUpdateCol = knex.schema.alterTable("invoice_history", table => {
    table.timestamp("updated_at").defaultTo(knex.fn.now()).notNull();
  });
  return Promise.all([drop_foreign_status, del_invoice_status_data, init_invoice_status, addTimeUpdateCol]);
};

exports.down = function (knex) {};
