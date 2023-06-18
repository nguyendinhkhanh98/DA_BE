const knex = require("../../config/database.js");

module.exports.getListInvoiceStatus = () => {
  return knex("invoice_status").select("*");
};
