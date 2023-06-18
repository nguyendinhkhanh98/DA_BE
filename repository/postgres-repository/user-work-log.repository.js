const { into } = require("../../config/database.js");
const knex = require("../../config/database.js");

const saveUserWorkdaysByProjectInMonth = (user_id, project_id, actual_work_day, month) => {
  knex.insert({ user_id, project_id, actual_work_day, month })
  .into("user_work_day")
  .returning("*");
};

module.exports = {
  saveUserWorkdaysByProjectInMonth
}