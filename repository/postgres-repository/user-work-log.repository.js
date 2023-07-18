const { into } = require("../../config/database.js");
const knex = require("../../config/database.js");

const saveUserWorkdaysByProjectInMonth = (user_id, project_id, actual_work_day, month) => {
  knex.insert({ user_id, project_id, actual_work_day, month })
  .into("user_work_day")
  .returning("*");
};

const getAllNotificationByUserId = ({ id, isRead}) => {
  return knex('notification').select('*').where({ user_id: id }).whereIn('isRead', isRead)
};

const putAllNotificationByUserId = async({ id }) => {
  return knex('notification').where({ user_id: id }).update({ isRead: true })
};

module.exports = {
  saveUserWorkdaysByProjectInMonth,
  getAllNotificationByUserId,
  putAllNotificationByUserId
}