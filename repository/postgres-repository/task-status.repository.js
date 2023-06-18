const knex = require("../../config/database.js");

module.exports.getAllTaskStatus = () => {
  return knex("task_status").select("*");
};
