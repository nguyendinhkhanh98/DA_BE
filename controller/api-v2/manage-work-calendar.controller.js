const ManageWorkCalendar = require("../../repository/postgres-repository/manage-work-calendar.repository");
const APIError = require("../../utils/APIException/APIError");
const logger = require("../../utils/logger.js")(__filename);
//Lưu bản nháp lịch nên công ty
const saveTimeDraft = async (req, res, next) => {
  try {
    let { timeline } = req.body;
    let { id } = req.user;
    let newTimeline = await ManageWorkCalendar.saveTimeDraft(id, timeline);
    return res.status(200).send(newTimeline);
  } catch (error) {
    logger.error(error);
    return next(
      new APIError({
        status: 500,
        message: error.message
      })
    );
  }
};
//Lấy lịch làm việc nháp của tháng hiện tại
const getTimeDraft = async (req, res, next) => {
  try {
    let { id } = req.user;
    let timeline = await ManageWorkCalendar.getTimeDraft(id);
    return res.status(200).send(timeline);
  } catch (error) {
    return next(
      new APIError({
        status: 500,
        message: error.message
      })
    );
  }
};
//Đăng kí lịch làm việc theo tháng
const saveTimeWork = async (req, res, next) => {
  try {
    let { timeline } = req.body;
    let { id, fullName } = req.user;
    let newTimeline = await ManageWorkCalendar.saveTimeWork(id, timeline, fullName);
    return res.status(200).send(newTimeline);
  } catch (error) {
    logger.error(error);
    return next(
      new APIError({
        status: 500,
        message: error.message
      })
    );
  }
};
//Lấy lịch làm việc đã đăng kí của tháng hiện tại
const getTimeWork = async (req, res, next) => {
  try {
    let { id } = req.user;
    let { month, year } = req.body;
    let timeline = await ManageWorkCalendar.getTimeWork(id, month, year);
    return res.status(200).send(timeline);
  } catch (error) {
    return next(
      new APIError({
        status: 500,
        message: error.message
      })
    );
  }
};
//Lấy lịch làm việc của  nhóm trong tháng
const getTimeWorkOfTeam = async (req, res, next) => {
  try {
    let { id } = req.user;
    let timeline = await ManageWorkCalendar.getTimeWorkOfTeam(id);
    return res.status(200).send(timeline);
  } catch (error) {
    return next(
      new APIError({
        status: 500,
        message: error.message
      })
    );
  }
};
module.exports = {
  getTimeWorkOfTeam: getTimeWorkOfTeam,
  getTimeWork: getTimeWork,
  saveTimeWork: saveTimeWork,
  getTimeDraft: getTimeDraft,
  saveTimeDraft: saveTimeDraft
};
