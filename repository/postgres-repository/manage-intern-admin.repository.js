const { db } = require("../../config/database.pg-promise");
const moment = require("moment");
const ROLES = require("../../middleware/authority-const");
const knex = require("../../config/database");

//Lấy lịch làm việc của all intern
let getTimeWorkOfTeam = time => {
  return new Promise(async (resolve, reject) => {
    // let result = await db.any(
    //   "SELECT TW.*,UT.* FROM (SELECT time_work.* from time_work  where time_work.start >=$1 AND time_work.start <=$2 ) TW RIGHT JOIN (SELECT full_name,user_profile.id from user_profile,user_role,role,user Where role.name=$3 AND user.delete_flag=$4 AND role.id=user_role.role_id AND user_role.user_id=user_profile.id AND user.id = user_profile.id) as UT ON UT.id=TW.internid",
    //   [time.start, time.end, ROLES.ROLE_INTERN, false]
    // );
    let result = await db.any(
      "SELECT TW.*,UT.* FROM (SELECT time_work.* from time_work  where time_work.start >=$1 AND time_work.start <=$2 ) TW RIGHT JOIN (SELECT full_name,user_profile.id from user_profile,user_role,role Where role.name=$3 AND role.id=user_role.role_id AND user_role.user_id=user_profile.id) as UT ON UT.id=TW.internid",
      [time.start, time.end, ROLES.ROLE_INTERN]
    );
    let timeWork = {};
    result.forEach(res => {
      let start = res.start;
      let value = res.value;
      if (timeWork[res.id]) {
        timeWork[res.id][moment(res.start).format("D")] = res.value;
        timeWork[res.id][moment(res.start).format("D")] = { value, start };
      } else {
        timeWork[res.id] = [];
        timeWork[res.id][0] = res.full_name;
        timeWork[res.id][moment(res.start).format("D")] = { value, start };
      }
    });
    resolve(timeWork);  
  });
};

let getListIntern = () => {
  return new Promise(async (resolve, reject) => {
    let result = await db.any(
      "select user_profile.* from user_profile,user_role,role Where user_id=user_profile.id AND role_id=role.id AND role.name=$1",
      [ROLES.ROLE_INTERN]
    );
    resolve(result);
  });
};

let getSalaries = () => {
  return new Promise(async (resolve, reject) => {
    let result = await db.any(
      "SELECT user_profile.full_name,salary.* from user_profile,salary,user_role,role where role_id=role.id AND role.name=$1 AND salary.internid=user_role.user_id AND user_role.user_id=user_profile.id ",
      [ROLES.ROLE_INTERN]
    );
    resolve(result);
  });
};

let searchInternToAddSalary = keyword => {
  return new Promise(async (resolve, reject) => {
    keyword = "%" + keyword.toLowerCase() + "%";
    let users = await db.any(
      "SELECT distinct ListIntern.* from salary RIGHT JOIN (select user_profile.full_name,user_profile.id from user_profile,user_role,role Where lower(full_name) LIKE $1 AND user_id=user_profile.id AND role_id=role.id AND role.name=$2) as ListIntern ON salary.internid=ListIntern.id where salaryaday IS NULL ",
      [keyword, ROLES.ROLE_INTERN]
    );
    resolve(users);
  });
};

// Update thời gian thực tập của intern
let updateTimeWorkIntern = (data) => {
  return knex.transaction( trx => {
    const queries = [];
    data.forEach(item => {
      const { id, value, dayOfMonth } = item;
      var data = { internid: id, value: value, start: dayOfMonth };
      var insert = knex('time_work').insert(data);
      var dataClone = { id: id, value: value, start: dayOfMonth };
      delete dataClone.id;
      delete dataClone.start;

      var update = knex('time_work').update(dataClone);
      // .whereRaw('internid = ? AND start::date = ?', [id, dayOfMonth]);
      // var update = `update time_work set value = ${value} where internid = ${id} and start >= ${dayOfMonth}::date and start < (${dayOfMonth}::date + '1 day'::interval)`;
      var query = `${ insert.toString() } ON CONFLICT (internid, start) DO UPDATE SET ${ update.toString().replace(/^update\s.*\sset\s/i, '') }`;

      queries.push(knex.raw(query).transacting(trx));
    })
    Promise.all(queries)
      .then(trx.commit)
      .catch(trx.rollback)
  })
};

// Xóa toàn bộ thời gian thực tập của intern
let deleteTimeWorkIntern = id => {
  return knex("time_work").where('internid', id).delete();
};

module.exports = {
  getTimeWorkOfTeam: getTimeWorkOfTeam,
  getListIntern: getListIntern,
  getSalaries: getSalaries,
  searchInternToAddSalary: searchInternToAddSalary,
  updateTimeWorkIntern: updateTimeWorkIntern,
  deleteTimeWorkIntern: deleteTimeWorkIntern,
};
