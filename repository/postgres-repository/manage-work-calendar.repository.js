const { db } = require("../../config/database.pg-promise");
const moment = require("moment");
const Mail = require("../../service/email");
const transMail = require("../../utils/template-mail");
const { time } = require("cron");
let saveTimeDraft = (id, timeline) => {
  return new Promise(async (resolve, reject) => {
    try {
      let month = moment().format("M");
      await db.any("DELETE FROM time_work_draft where internid=$1 and  DATE_PART('month',start )=$2", [id, month]);
      let newTimelinePromise = timeline.map(async day => {
        let eventDay = await db.any("INSERT INTO time_work_draft VALUES ($1,$2,$3) RETURNING value,start", [
          id,
          day.start,
          day.value
        ]);
        return eventDay[0];
      });
      let newTimeline = await Promise.all(newTimelinePromise);
      resolve(newTimeline);
    } catch (error) {
      reject(error);
    }
  });
};
//Lấy bản nháp lịch làm việc
let getTimeDraft = id => {
  return new Promise(async (resolve, reject) => {
    let month = moment().format("M");
    let year = moment().format("Y");
    let timeline = await db.any(
      "SELECT value,start from time_work_draft where internid=$1 AND DATE_PART('month',start )=$2 AND DATE_PART('year',start )=$3 ",
      [id, month, year]
    );
    resolve(timeline);
  });
};
//Đăng kí lịch làm việc
let saveTimeWork = (id, timeline, name) => {
  return new Promise(async (resolve, reject) => {
    try {
      let month = moment().format("M");
      let timeDelete = await db.any(
        "DELETE FROM time_work where internid=$1 and  DATE_PART('month',start )=$2 RETURNING *",
        [id, month]
      );

      let newTimelinePromise = timeline.map(async day => {
        let eventDay = await db.any("INSERT INTO time_work VALUES ($1,$2,$3) RETURNING value,start", [
          id,
          day.start,
          day.value
        ]);
        return eventDay[0];
      });
      let newTimeline = await Promise.all(newTimelinePromise);

      let content;
      if (timeDelete.length) {
        content = "đã sửa";
      } else {
        content = "đã đăng kí";
      }
      let leader = await db.any(
        "SELECT public.user.email,public.user.username from public.user,user_of_team UT,teams Where  UT.internid=$1 AND teams.id=UT.teamid AND teams.leaderid=public.user.id",
        [id]
      );
      if (leader.length > 0) {
        let link = process.env.CLIENT_URL + "/intern-management/view-time";
        let mailOptions = {
          from: "jira.qcd@gmail.com",
          to: leader[0].email,
          subject: transMail.subject,
          html: transMail.template(name, content, leader[0].username, month, link)
        };
        await Mail.sendEmail(mailOptions);
      }
      resolve(newTimeline);
    } catch (error) {
      reject(error);
    }
  });
};
//Lấy bản nháp lịch làm việc
let getTimeWork = (id, month, year) => {
  return new Promise(async (resolve, reject) => {
    let timeline = await db.any(
      "SELECT value,start from time_work where internid=$1 AND DATE_PART('month',start )=$2 AND DATE_PART('year',start )=$3 ",
      [id, month, year]
    );
    resolve(timeline);
  });
};
module.exports = {
  getTimeWork: getTimeWork,
  getTimeDraft: getTimeDraft,
  saveTimeWork: saveTimeWork,
  saveTimeDraft: saveTimeDraft
};
