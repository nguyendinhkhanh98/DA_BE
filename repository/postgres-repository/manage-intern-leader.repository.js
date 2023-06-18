const { db } = require("../../config/database.pg-promise");
const moment = require("moment");
const listRole = require("../../middleware/authority-const");
const knex = require("../../config/database");
//Lấy lịch làm việc của cả nhóm
let getTimeWorkOfTeam = (id, time) => {
  return new Promise(async (resolve, reject) => {
    let start = moment(time.start).toDate();
    let end = moment(time.end).toDate();
    let result = await db.any(
      "SELECT TW.*,full_name,UOT.id from  ( SELECT full_name,user_profile.id  from user_of_team UT,teams,user_profile Where  teams.leaderid=$3 AND teams.id=UT.teamid AND UT.internid=user_profile.id) as UOT LEFT JOIN (SELECT * from  time_work where start>=$1 AND start <=$2 ) as TW ON UOT.id=TW.internid ",
      [start, end, id]
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
let getListIntern = id => {
  return new Promise(async (resolve, reject) => {
    let idTeam = await db.any("SELECT id from teams where leaderid=$1", [id]);
    if (idTeam.length > 0) {
      let listIntern = await db.any(
        "select distinct user_profile.* from user_profile,user_role,role,user_of_team UT,teams Where teams.leaderid=$1 AND teams.id=UT.teamid AND  UT.internid=user_profile.id",
        [id]
      );
      resolve(listIntern);
    } else {
      let newTeamID = await db.any("INSERT INTO teams(leaderid) values ($1) RETURNING id", [id]);
      resolve([]);
    }
  }).catch(err => {
    reject(err);
  });
};
let delInternFromTeam = id => {
  return new Promise(async (resolve, reject) => {
    await db.any("DELETE FROM user_of_team where internid=$1", [id]);
    await db.any("DELETE FROM salary where internid=$1", [id]);
    await db.any("DELETE FROM history_salary where internid=$1", [id]);
    resolve(true);
  }).catch(err => {
    reject(err);
  });
};
let searchUser = keyword => {
  return new Promise(async (resolve, reject) => {
    try {
      keyword = "%" + keyword.toLowerCase() + "%";
      let users = await db.any(
        "SELECT distinct ListIntern.*,UOT.teamid from user_of_team as UOT RIGHT JOIN (select user_profile.* from user_profile,user_role,role Where lower(full_name) LIKE $1 AND user_id=user_profile.id AND role_id=role.id AND role.name=$2) as ListIntern ON UOT.internid=ListIntern.id where teamid IS NULL ",
        [keyword, listRole.ROLE_INTERN]
      );
      resolve(users);
    } catch (error) {
      reject(error);
    }
  });
};
let addInternToTeam = (id, newIntern) => {
  return new Promise(async (resolve, reject) => {
    try {
      let today = moment();
      let teamid = await db.any("SELECT id from teams where leaderid=$1", [id]);
      let intern = await db.any("INSERT INTO user_of_team values ($1,$2,$3) RETURNING *", [
        newIntern,
        teamid[0].id,
        today
      ]);
      resolve(intern[0]);
    } catch (error) {
      reject(error);
    }
  });
};
let getSalaries = id => {
  return new Promise(async (resolve, reject) => {
    try {
      let listSalary = await db.any(
        "SELECT salary.*,full_name from user_of_team UT,teams,salary,user_profile Where teams.leaderid=$1 AND teams.id=UT.teamid AND UT.internid=salary.internid AND UT.internid=user_profile.id",
        [id]
      );
      resolve(listSalary);
    } catch (error) {
      reject(error);
    }
  });
};
let searchInternToAddSalary = (id, keyword) => {
  return new Promise(async (resolve, reject) => {
    try {
      keyword = "%" + keyword.toLowerCase() + "%";
      let interns = await db.any(
        "SELECT distinct ListIntern.* from salary RIGHT JOIN (select user_profile.full_name,user_profile.id from user_profile,user_of_team  UOT,teams Where leaderid=$1 AND teams.id=UOT.teamid AND UOT.internid=user_profile.id AND  lower(full_name) LIKE $2) as ListIntern ON salary.internid=ListIntern.id where salaryaday IS NULL ",
        [id, keyword]
      );
      resolve(interns);
    } catch (error) {
      reject(error);
    }
  });
};
const addSalaryForIntern = (internid, salary) => {
  return new Promise(async (resolve, reject) => {
    try {
      let today = moment();
      let month = moment().format("MM-YYYY");
      await db.any("INSERT INTO salary values ($1,$2,$3) ", [internid, today, salary]);
      await db.any("INSERT INTO history_salary values ($1,$2,$3,$4) ", [internid, today, salary, month]);
      resolve(true);
    } catch (error) {
      reject(error);
    }
  });
};

let getSalaryHistory = id => {
  return new Promise(async (resolve, reject) => {
    let historySalary = await db.any("SELECT * from history_salary where internid=$1", [id]);
    resolve(historySalary);
  });
};

let updateSalary = (id, salary) => {
  return new Promise(async (resolve, reject) => {
    let today = moment();
    let month = moment().format("MM-YYYY");
    await db.any("DELETE FROM history_salary WHERE internid=$1 AND month=$2", [id, month]);
    db.any("INSERT INTO history_salary VALUES($1,$2,$3,$4)", [id, today, salary, month])
      .then(async v => {
        await db.any("UPDATE salary SET updateat=$1,salaryaday=$2  where internid=$3", [today, salary, id]);
        resolve(true);
      })
      .catch(err => {
        reject(err);
      });
  });
};
let getTimeWorkToSendSlack = () => {
  return new Promise(async (resolve, reject) => {
    let allTeam = await db.any("SELECT id,leaderid,urlslack from teams");
    var now = moment().format("YYYY-MM-DD");
    var monday = moment(now).clone().weekday(1);
    var sunday = moment(now).clone().weekday(7);
    let timeWorkPromise = allTeam.map(async team => {
      let time = await db.any(
        "SELECT TW.*,full_name,UOT.id from  ( SELECT full_name,user_profile.id  from user_of_team UT,user_profile Where UT.teamid=$1 AND UT.internid=user_profile.id) as UOT LEFT JOIN (SELECT * from  time_work where start>=$2 AND start <=$3 ) as TW ON UOT.id=TW.internid",
        [team.id, monday, sunday]
      );
      let timeWork = {};
      time.forEach(res => {
        if (timeWork[res.internid]) {
          timeWork[res.internid][moment(res.start).weekday()] = res.value;
        } else {
          timeWork[res.internid] = [];
          timeWork[res.internid][0] = res.full_name;
          timeWork[res.internid][moment(res.start).weekday()] = res.value;
        }
      });
      team.timeWork = timeWork;
      return team;
    });
    let timeWork = await Promise.all(timeWorkPromise);
    resolve(timeWork);
  });
};
let updateLinkSlack = (id, link) => {
  return new Promise(async (resolve, reject) => {
    await db.any("UPDATE teams SET urlslack=$1 WHERE leaderid=$2", [link, id]);
    resolve(true);
  });
};
//Xóa trợ cấp
let deleteSalary = id => {
  return new Promise(async (resolve, reject) => {
    try {
      await db.any("DELETE FROM salary where internid=$1", [id]);
      await db.any("DELETE FROM history_salary where internid=$1", [id]);
    } catch (error) {
      reject(error);
    }

    resolve(true);
  });
};

// Update thời gian thực tập của intern
let updateTimeWorkIntern = (data) => {
  return knex.transaction( trx => {
    const queries = [];
    data.forEach(item => {
      const { id, value, dayOfMonth } = item;
      var data = { id: id, value: value, start: dayOfMonth };
      var insert = knex('time_work').insert(data);
      var dataClone = { id: id, value: value, start: dayOfMonth };

      delete dataClone.id;
      delete dataClone.dayOfMonth;

      // var update = knex('time_work').update(dataClone).whereRaw('time_work.id = ' + data.id + 'AND start >= ' + data.start + "AND start <");
      var update = `update time_work set value = ${value} where internid = ${id} and start >= ${dayOfMonth}::date and start < (${dayOfMonth}::date + '1 day'::interval)`;
      var query = `${ insert.toString() } ON CONFLICT (id, start) DO UPDATE SET ${ update.toString().replace(/^update\s.*\sset\s/i, '') }`;

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
  delInternFromTeam: delInternFromTeam,
  searchUser: searchUser,
  addInternToTeam: addInternToTeam,
  getSalaries: getSalaries,
  searchInternToAddSalary: searchInternToAddSalary,
  addSalaryForIntern: addSalaryForIntern,
  getSalaryHistory: getSalaryHistory,
  updateSalary: updateSalary,
  getTimeWorkToSendSlack: getTimeWorkToSendSlack,
  updateLinkSlack: updateLinkSlack,
  deleteSalary: deleteSalary,
  updateTimeWorkIntern: updateTimeWorkIntern,
  deleteTimeWorkIntern: deleteTimeWorkIntern,
};
