const ManageInternLeader = require("../../repository/postgres-repository/manage-intern-leader.repository");
const ManageInternAdmin = require("../../repository/postgres-repository/manage-intern-admin.repository");
const APIError = require("../../utils/APIException/APIError");
const ROLE = require("../../middleware/authority-const");
const logger = require("../../utils/logger.js")(__filename);

//Lấy lịch làm việc của intern trong tháng
const getTimeWorkOfTeam = async (req, res, next) => {
  try {
    let { id } = req.user;
    let time = req.body;
    let { permissions } = req.user;
    let timeline;
    if (permissions.indexOf(ROLE.ROLE_ADMIN) != -1) {
      //Lấy lịch làm việc của tất cả Intern (quyền ADMIN)
      timeline = await ManageInternAdmin.getTimeWorkOfTeam(time);
    } else {
      //Lấy lịch làm việc của Intern trong team (quyền LEADER)
      timeline = await ManageInternLeader.getTimeWorkOfTeam(id, time);
    }

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

const getListIntern = async (req, res, next) => {
  try {
    let { id } = req.user;
    let { permissions } = req.user;
    let listIntern;
    if (permissions.indexOf(ROLE.ROLE_ADMIN) != -1) {
      //Lấy danh sách tất cả (quyền ADMIN)
      listIntern = await ManageInternAdmin.getListIntern();
    } else {
      //Lấy danh sách Intern trong team (quyền LEADER)
      listIntern = await ManageInternLeader.getListIntern(id);
    }
    return res.status(200).send(listIntern);
  } catch (error) {
    return next(
      new APIError({
        status: 500,
        message: error.message
      })
    );
  }
};

//Xóa intern khỏi nhóm
const delInternFromTeam = async (req, res, next) => {
  try {
    let { id } = req.body;
    await ManageInternLeader.delInternFromTeam(id);
    return res.status(200).send(true);
  } catch (error) {
    return next(
      new APIError({
        status: 500,
        message: error.message
      })
    );
  }
};

const searchUser = async (req, res, next) => {
  try {
    let { keyword } = req.body;
    let users = await ManageInternLeader.searchUser(keyword);
    return res.status(200).send(users);
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

const addInternToTeam = async (req, res, next) => {
  try {
    let { newIntern } = req.body;
    let { id } = req.user;
    let intern = await ManageInternLeader.addInternToTeam(id, newIntern);
    return res.status(200).send(intern);
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

//Lấy danh sách trợ cấp của intern
const getSalaries = async (req, res, next) => {
  try {
    let { id } = req.user;
    let { permissions } = req.user;
    let listSalaries;
    if (permissions.indexOf(ROLE.ROLE_ADMIN) != -1) {
      //Lấy danh sách trợ cấp cảu tất cả intern (quyền ADMIN)
      listSalaries = await ManageInternAdmin.getSalaries();
    } else {
      //Lấy danh sách trợ cấp của intern trong nhóm (quyền LEADER)
      listSalaries = await ManageInternLeader.getSalaries(id);
    }
    return res.status(200).send(listSalaries);
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

//Search intern to add salary
const searchInternToAddSalary = async (req, res, next) => {
  try {
    let { id } = req.user;
    let { permissions } = req.user;
    let { keyword } = req.body;
    let interns;
    if (permissions.indexOf(ROLE.ROLE_ADMIN) != -1) {
      //Lấy danh sách trợ cấp cảu tất cả intern (quyền ADMIN)
      interns = await ManageInternAdmin.searchInternToAddSalary(keyword);
    } else {
      //Lấy danh sách trợ cấp của intern trong nhóm (quyền LEADER)
      interns = await ManageInternLeader.searchInternToAddSalary(id, keyword);
    }
    return res.status(200).send(interns);
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

const addSalaryForIntern = async (req, res, next) => {
  try {
    const { internid, salary } = req.body;
    let intern = await ManageInternLeader.addSalaryForIntern(internid, salary);
    return res.status(200).send(intern);
  } catch (error) {
    return next(
      new APIError({
        status: 500,
        message: error.message
      })
    );
  }
};

const getSalaryHistory = async (req, res, next) => {
  try {
    let { id } = req.body;
    let historySalary = await ManageInternLeader.getSalaryHistory(id);
    return res.status(200).send(historySalary);
  } catch (error) {
    return next(
      new APIError({
        status: 500,
        message: error.message
      })
    );
  }
};

//Sửa salary của intern
const updateSalary = async (req, res, next) => {
  try {
    let { id, salary } = req.body;
    await ManageInternLeader.updateSalary(id, salary);
    return res.status(200).send(true);
  } catch (error) {
    return next(
      new APIError({
        status: 500,
        message: error.message
      })
    );
  }
};

//Sửa link slack cho intern
const updateLinkSlack = async (req, res, next) => {
  try {
    let { link } = req.body;
    let { id } = req.user;
    await ManageInternLeader.updateLinkSlack(id, link);
    return res.status(200).send(true);
  } catch (error) {
    return next(
      new APIError({
        status: 500,
        message: error.message
      })
    );
  }
};

//Xóa trợ cấp của intern
const deleteSalary = async (req, res, next) => {
  try {
    let { id } = req.body;
    await ManageInternLeader.deleteSalary(id);
    return res.status(200).send(true);
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

// Sửa thời gian thực tập hằng ngày của intern
const updateTimeWorkIntern = async (req, res, next) => {
  try {
    let { permissions } = req.user;
    let data = req.body;
    let updateTimeIntern;
    
    if (permissions.indexOf(ROLE.ROLE_ADMIN) != -1) {
      updateTimeIntern = await ManageInternAdmin.updateTimeWorkIntern(data);
    }
    else {
      updateTimeIntern = await ManageInternLeader.updateTimeWorkIntern(data);
    }
    return res.status(200).send(updateTimeIntern);
  }catch(error) {
    logger.error(error);
    return next(
      new APIError({
        status: 500,
        message: error.message
      })
    );
  }
};

// Xóa lịch trình thực tập của intern
const deleteTimeWorkIntern = async (req, res, next) => {
  try {
    let { id } = req.params;
    let { permissions } = req.user;
    if(permissions.indexOf(ROLE.ROLE_ADMIN) != -1) {
      await ManageInternAdmin.deleteTimeWorkIntern(id);
    }
    else {
      await ManageInternLeader.deleteTimeWorkIntern(id);
    }
    return res.status(200).send(true);
  }catch(error) {
    logger.error(error);
    return next(
      new APIError({
        status: 500,
        message: error.message
      })
    )
  }
}

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
  updateLinkSlack: updateLinkSlack,
  deleteSalary: deleteSalary,

  updateTimeWorkIntern: updateTimeWorkIntern,
  deleteTimeWorkIntern: deleteTimeWorkIntern,
};
