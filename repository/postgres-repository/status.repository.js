const knex = require("../../config/database.js");

module.exports.getAllStatus = () => {
  return knex.select().from("status");
};
