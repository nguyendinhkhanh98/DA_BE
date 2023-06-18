const _ = require("lodash");

const extractInvoiceInProject = listInvoice => {
  let listUniqInvoice = _.uniqBy(listInvoice, item => item.invoice_id);

  return listUniqInvoice.map(invoice => {
    let listHistoryInvoice = listInvoice.filter(item => item.invoice_id == invoice.invoice_id);

    return {
      name: invoice.invoice_name,
      invoice_id: invoice.invoice_id,
      project_id: invoice.project_id,
      user_created: invoice.user_created,
      cost: invoice.cost,
      start_date: invoice.start_date,
      end_date: invoice.end_date,
      due_date: invoice.due_date,
      invoice_number: invoice.invoice_number,
      created_at: invoice.invoice_created_date,
      history: extractHistoryOfInvoice(listHistoryInvoice)
    };
  });
};

const extractHistoryOfInvoice = listHistoryInvoice => {
  return listHistoryInvoice.map(status => ({
    id: status.status_id,
    name: status.status,
    updated_at: status.updated_date
  }));
};
class InvoiceEntity {
  extractInvoiceByProject(rawInvoiceList) {
    if (!rawInvoiceList.length) return null;
    let project = rawInvoiceList[0];

    return {
      id: project.project_id,
      project_name: project.project_name,
      project_key: project.project_key,
      jira_url: project.jira_url,
      invoices: extractInvoiceInProject(rawInvoiceList)
    };
  }
}

module.exports = InvoiceEntity;
