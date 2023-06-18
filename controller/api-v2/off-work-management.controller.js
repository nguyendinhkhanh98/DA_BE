const _ = require("lodash");
const moment = require("moment");
const Formatter = require("response-format");
const OffWorkRepository = require("../../repository/postgres-repository/off-work.repository");
const UserRepository = require("../../repository/postgres-repository/user.repository");
const OffWorkUtils = require("../../utils/hr-management/hr-management.util");
const logger = require("../../utils/logger.js")(__filename);
const HrUtils = require("../../utils/hr-management/hr-management.util");

const STATUS = {
  Pending: "Pending",
  Approved: "Approved",
  Rejected: "Rejected"
};

const createRecordOffWork = async (req, res) => {
  req.body.status = STATUS.Pending;
  logger.debug("Create off work data: ", req.body);
  try {
    let record = await OffWorkRepository.createRequestOffWork(req.user.id, req.body);
    let userInfo = await UserRepository.findUserInfo(record[0].user_id);
    let managerInfo = await UserRepository.findUserInfo(record[0].manager_id);

    HrUtils.sendEmailOffworkToManager(userInfo[0], managerInfo[0], record[0]);
    res.json(Formatter.success("Created new request successfully!", record));
  } catch (error) {
    res.json(Formatter.badRequest("Sorry, you cannot additional more at this day!", null));
  }
};

const getOffWorkHistoryInMonth = async (req, res) => {
  try {
    let data = await OffWorkRepository.getOffWorkHistoryInMonth(req.user.id, req.query.year, req.query.month);
    res.json(Formatter.success(null, data));
  } catch (error) {
    res.json(Formatter.internalError("Sorry, server busy!", null));
  }
};

const getOffWorkHistoryByRange = async (req, res) => {
  try {
    let data = await OffWorkRepository.getOffWorkHistoryByRange(req.user, req.query);
    data = OffWorkUtils.getOffWorkInDuration(data, req.query.start, req.query.end);
    res.json(Formatter.success(null, data));
  } catch (error) {
    res.json(Formatter.internalError("Sorry, server busy!", null));
  }
};

const getListStatus = async (req, res) => {
  res.json(Formatter.success(null, STATUS));
};

const changeStatus = async (req, res) => {
  try {
    let data = await OffWorkRepository.changeStatus(req.body.id, req.body.status);
    res.json(Formatter.success("Change status successful!", data));
  } catch (error) {
    res.json(Formatter.internalError("Sorry, server busy!", null));
  }
};

const getLatestManager = async (req, res) => {
  try {
    let data = await OffWorkRepository.getLatestManager(req.user.id);
    res.json(Formatter.success("Get latest manager successful!", data));
  } catch (error) {
    res.json(Formatter.internalError("Sorry, server busy!", null));
  }
};

module.exports = {
  getOffWorkHistoryInMonth,
  createRecordOffWork,
  getOffWorkHistoryByRange,

  getListStatus,
  changeStatus,
  getLatestManager
};
