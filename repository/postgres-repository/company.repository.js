const knex = require("../../config/database.js");

module.exports.getAllCompany = () => {
  return knex.select().from("company");
};
