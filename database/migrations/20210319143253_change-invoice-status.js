exports.up = function (knex) {
  const changePlanName = knex("invoice_status").update({ name: "Plan" }).where({ name: "PLAN" });
  const changeInvoiceIssued = knex("invoice_status")
    .update({ name: "Invoice Issued" })
    .where({ name: "INVOICE issued" });

  return Promise.all([changePlanName, changeInvoiceIssued]);
};

exports.down = function (knex) {
  const changePlanName = knex("invoice_status").update({ name: "PLAN" }).where({ name: "Plan" });
  const changeInvoiceIssued = knex("invoice_status")
    .update({ name: "INVOICE issued" })
    .where({ name: "Invoice Issued" });

  return Promise.all([changePlanName, changeInvoiceIssued]);
};
