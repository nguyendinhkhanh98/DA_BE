const knex = require("../../config/database.js");

module.exports.getAll = () => {
  return knex.select().from("purpose");
};

module.exports.insert = (trx, purpose) => {
  if (trx) return trx("purpose").insert(purpose).returning("id");
  return knex("purpose").insert(purpose).returning("id");
};
