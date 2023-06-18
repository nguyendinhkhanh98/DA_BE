const Formatter = require("response-format");
const APIErrorWithKnex = require("../../utils/APIException/APIErrorWithKnex");
const UserProjectRoleRepository = require("../../repository/postgres-repository/user-project-role.repository");
const knex = require("../../config/database");
const e = require("express");

module.exports.addUserProjectRole = async (req, res, next) => {
  let { user_id, role_id, start_date, end_date, comment } = req.body;
  let task_id = req.params.id;
  try {
    let newRecord = await UserProjectRoleRepository.addUserProjectRole(
      user_id,
      role_id,
      task_id,
      start_date,
      end_date,
      comment
    );
    res.json(Formatter.success("added_a_user_project_role", newRecord));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.updateUserProjectRole = async (req, res, next) => {
  let { id, user_id, role_id, start_date, end_date, comment } = req.body;
  let task_id = req.params.id;
  try {
    let updatedRecord = await UserProjectRoleRepository.updateUserProjectRole(
      id,
      user_id,
      role_id,
      task_id,
      start_date,
      end_date,
      comment
    );
    res.json(Formatter.success("updated_a_user_project_role", updatedRecord));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.deleteUserProjectRole = async (req, res, next) => {
  let { id } = req.params;
  try {
    let deletedRecord = await UserProjectRoleRepository.deleteUserProjectRole(id);
    res.json(Formatter.success("possibly_deleted_a_user_project_role", deletedRecord));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.getUserProjectRoles = async (req, res, next) => {
  let task_id = req.params.id;
  try {
    let response = await UserProjectRoleRepository.getUserProjectRoles(task_id);
    userProjectRoles = response.rows;
    res.json(Formatter.success(null, userProjectRoles));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};
