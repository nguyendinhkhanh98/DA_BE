const Formatter = require("response-format");
const APIErrorWithKnex = require("../../utils/APIException/APIErrorWithKnex");
const UserWorkDayRepository = require("../../repository/postgres-repository/user-work-log.repository");
const knex = require("../../config/database");
const e = require("express");

const saveUserWorkdaysByProjectInMonth = async (req, res, next) => {
  let { user_id, project_id, actual_work_day, month } = req.body;
  try {
    let newRecord = UserWorkDayRepository.saveUserWorkdaysByProjectInMonth(user_id, project_id, actual_work_day, month);
    res.json(Formatter.success("save_user_work_day_by_project", newRecord));
  }catch (error) {
    next( new APIErrorWithKnex({ errors: error }));
  }
};

module.exports = {
  saveUserWorkdaysByProjectInMonth
}