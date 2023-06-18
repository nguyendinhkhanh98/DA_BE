const knex = require("../../config/database.js");

const createRequestOffWork = (user_id, data) => {
  let payload = {
    user_id,
    manager_id: data.manager,
    type: data.type,
    reason: data.reason,
    date_created: data.date,
    status: data.status,
    data: data.data
  };
  return knex("time_off_work_history").insert(payload).returning("*");
};

const getOffWorkHistoryInMonth = (user_id, year, month) => {
  return tempTableQueryHistory().select("*").from("off_work_history_temp").where({ user_id, year, month });
};

const getOffWorkHistoryByRange = (user, { start, end, type }) => {
  let filterCondition = type == "admin" ? {} : { user_id: user.id };

  return tempTableQueryHistory().select("*").from("off_work_history_temp").where(filterCondition);
};

// Utils function
const tempTableQueryHistory = () => {
  let rawQuery = knex.raw(`
    select 
    time_off_work_history.id as id, u1.full_name as User, u2.full_name as Manager,
    user_id, type, manager_id, date_created, reason, data, status,
    EXTRACT (YEAR FROM date_created) AS YEAR,
    EXTRACT (MONTH FROM date_created) AS MONTH
    
    from time_off_work_history
    left join user_profile as u1
    on u1.id = user_id
    left join user_profile as u2
    on u2.id = manager_id`);

  return knex.with("off_work_history_temp", rawQuery);
};

const changeStatus = (id, status) => {
  return knex("time_off_work_history").update({ status }).where({ id });
};

const getLatestManager = user_id => {
  return knex("time_off_work_history").select("*").where({ user_id }).orderBy("id", "desc").limit(1);
};

module.exports = {
  createRequestOffWork,
  getOffWorkHistoryInMonth,
  getOffWorkHistoryByRange,
  changeStatus,
  getLatestManager
};
