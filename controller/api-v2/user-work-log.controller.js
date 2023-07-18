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

const getAllNotificationByUserId = async (req, res, next) => {
  const { id } = req.user;
  const { status } = req.query
  const isRead = []
  if(status == 'all' || !status) {
    isRead.push(true)
    isRead.push(false)
  }
  if(status == 'unread') {
    isRead.push(false)
  }
  if(status == 'readed') {
    isRead.push(true)
  }
  try {
    let newRecord = await UserWorkDayRepository.getAllNotificationByUserId({ id, isRead });
    res.json(Formatter.success("get_list_notification", newRecord));
  }catch (error) {
    next( new APIErrorWithKnex({ errors: error }));
  }
};

const putAllNotificationByUserId = async (req, res, next) => {
  try {
    const { id } = req.user;
    let newRecord = await UserWorkDayRepository.putAllNotificationByUserId({ id })
    res.json(Formatter.success("put_list_notification", newRecord));
  }catch (error) {
    next( new APIErrorWithKnex({ errors: error }));
  }
}

module.exports = {
  saveUserWorkdaysByProjectInMonth,
  getAllNotificationByUserId,
  putAllNotificationByUserId
}