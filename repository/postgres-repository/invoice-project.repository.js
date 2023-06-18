const { select } = require("../../config/database.js");
const knex = require("../../config/database.js");

module.exports.getInvoicesByProjectId = project_id => {
  return knex("invoice_project")
    .columns(
      "invoice_project.project_id",
      "invoice_project.user_created",
      "invoice_project.cost",
      "invoice_project.start_date",
      "invoice_project.end_date",
      "invoice_project.due_date",
      "invoice_project.invoice_number",
      {
        invoice_name: "invoice_project.name",
        invoice_id: "invoice_project.id",
        invoice_created_date: "invoice_project.created_at",
        updated_date: "invoice_history.updated_at",
        status: "invoice_status.name",
        status_id: "invoice_status.id",
        project_name: "task.name",
        project_key: "task.key",
        jira_url: "task.jira_url"
      }
    )
    .select()
    .leftJoin("invoice_history", "invoice_history.invoice_id", "invoice_project.id")
    .leftJoin("task", "task.id", "invoice_project.project_id")
    .leftJoin("invoice_status", "invoice_status.id", "invoice_history.status_id")
    .where({ project_id })
    .orderBy(["invoice_project.created_at", "invoice_history.status_id"]);
};

module.exports.upsertInvoice = invoices => {
  return knex.transaction(async trx => {
    let newInvoice = await upsertInvoiceProject(trx, invoices);
    newInvoice = newInvoice[0];
    let element = invoices;
    element.invoice_id = newInvoice.id;
    await upsertInvoiceHistory(trx, element);
  });
};

module.exports.getListInvoiceProject = () => {
  let rawQuery = knex.raw(`
  select distinct on (invoice_project.id) task.name,
       lastHistory.updated_at,
       due_date,
       invoice_number,
       cost,
       invoice_project.name as invoice_name,
       invoice_status.name as status_name,
       start_date,
       end_date,
       task.jira_url,
       task.key,
       task.id
from invoice_project
         inner join (select invoice_history.invoice_id,
                            max(invoice_history.updated_at) as updated_at
                     from invoice_history
                     group by invoice_history.invoice_id
) as lastHistory on invoice_project.id = lastHistory.invoice_id
         inner join invoice_history on invoice_history.updated_at = lastHistory.updated_at
         inner join invoice_status on invoice_status.id = invoice_history.status_id
         left join task on invoice_project.project_id = task.id
where task.delete_flag = false
    `);
  return knex.with("list_invoices", rawQuery).select("*").from("list_invoices");
};
//and task.status_id != 1 and invoice_status.name != 'Payment Done'

module.exports.deleteInvoiceById = invoice_id => {
  return knex.transaction(async trx => {
    await trx("invoice_history").delete().where({ invoice_id });
    await trx("invoice_project").delete().where({ id: invoice_id });
  });
};

const upsertInvoiceProject = (trx, invoice) => {
  let { id, project_id, name, user_created, start_date, end_date, due_date, invoice_number } = invoice;
  let isCreate = ["add", null, undefined].includes(id);

  if (!isCreate) {
    return trx("invoice_project")
      .update({ project_id, name, user_created, start_date, end_date, due_date, invoice_number })
      .where({ id })
      .returning("*");
  }
  return trx("invoice_project")
    .insert({ project_id, name, user_created, start_date, end_date, due_date, invoice_number })
    .returning("*");
};

const upsertInvoiceHistory = async (trx, history) => {
  let { invoice_id, status_id } = history;
  let existHistory = await trx("invoice_history").select("*").where({ invoice_id, status_id });

  if (existHistory.length) {
    return trx("invoice_history").update({ updated_at: knex.fn.now() }).where({ invoice_id, status_id }).returning("*");
  }
  return trx("invoice_history").insert({ invoice_id, status_id }).returning("*");
};
