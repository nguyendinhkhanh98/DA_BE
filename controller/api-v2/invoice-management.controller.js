const Formatter = require("response-format");
const InvoiceProjectRepository = require("../../repository/postgres-repository/invoice-project.repository");
const InvoiceStatusRepository = require("../../repository/postgres-repository/invoice-status.repository");
const InvoiceEntirty = require("../../entity/invoice.entity");
const APIErrorWithKnex = require("../../utils/APIException/APIErrorWithKnex");

module.exports.getListInvoiceByProjectId = async (req, res, next) => {
  const { id } = req.params;
  try {
    let invoices = await InvoiceProjectRepository.getInvoicesByProjectId(id);
    let extractInvoice = new InvoiceEntirty().extractInvoiceByProject(invoices);
    res.json(Formatter.success(null, extractInvoice));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.getListInvoiceStatus = async (req, res, next) => {
  try {
    let status = await InvoiceStatusRepository.getListInvoiceStatus();
    res.json(Formatter.success(null, status));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.createInvoiceProject = async (req, res, next) => {
  let invoice = req.body;
  invoice.user_created = req.user.id;
  try {
    let newInvoice = await InvoiceProjectRepository.upsertInvoice(invoice);
    res.json(Formatter.success("created_new_invoice", newInvoice));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.updateInvoiceByProjectId = async (req, res, next) => {
  let invoice = req.body;
  invoice.user_created = req.user.id;
  try {
    let newInvoice = await InvoiceProjectRepository.upsertInvoice(invoice);
    res.json(Formatter.success("updated_invoice_infomation", newInvoice));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.getListInvoiceProject = async (req, res, next) => {
  try {
    let projects = await InvoiceProjectRepository.getListInvoiceProject();
    res.json(Formatter.success(null, projects));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.deleteInvoiceByInvoiceId = async (req, res, next) => {
  const { id } = req.params;
  try {
    await InvoiceProjectRepository.deleteInvoiceById(id);
    res.json(Formatter.success("delete_invoice_successfully", null));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};
