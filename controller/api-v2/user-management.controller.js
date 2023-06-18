const Formatter = require("response-format");
const UserRepository = require("../../repository/postgres-repository/user.repository");
const RoleRepository = require("../../repository/postgres-repository/role.repository");
const ProjectRepository = require("../../repository/postgres-repository/project.repository");
const UserUtils = require("../../utils/user-management.util");
const logger = require("../../utils/logger.js")(__filename);

const getListLeader = async (req, res) => {
  try {
    let users = await UserRepository.getUserListFullInfo();
    users = UserUtils.extractUserList(users);
    let leaders = UserUtils.filterUserByRole(users, ["admin", "manager", "leader"]);
    res.json(Formatter.success(null, leaders));
  } catch (error) {
    logger.error(error);
    res.json(Formatter.unavailable("Sorry, server busy!", null));
  }
};

const restoreUserById = async (req, res) => {
  const { user_id } = req.body;
  try {
    let data = await UserRepository.restoreUserById(user_id);
    res.json(Formatter.success("Restore user successfully!", data));
  } catch (error) {
    return res.json(Formatter.badRequest("Sorry, cannot restore this user", null));
  }
};

const getAllUser = async (req, res) => {
  let users = await UserRepository.getAllUser();
  users = UserUtils.extractUserList(users);

  return res.json(Formatter.success(null, users));
};

const getAllUserProject = async (req, res) => {
  let users = await UserRepository.getAllUserProject();
  // users = UserUtils.extractUserList(users);

  return res.json(Formatter.success(null, users));
};

const updateRoleById = async (req, res) => {
  try {
    if (!req.body.name) throw new Error("Name is empty");

    await RoleRepository.upsertRole(req.body);
    res.json(Formatter.success("update_role_successfully", null));
  } catch (error) {
    console.error(error);
    res.json(Formatter.badRequest());
  }
};

const deprecateRoleById = async (req, res) => {
  const { id } = req.params;
  try {
    await RoleRepository.deprecateRoleById(id);
    res.json(Formatter.success("deprecate_role_successfully", null));
  } catch (error) {
    console.error(error);
    res.json(Formatter.badRequest());
  }
};

const restoreRoleById = async (req, res) => {
  const { id } = req.params;
  try {
    await RoleRepository.restoreRoleById(id);
    res.json(Formatter.success("restore_role_successfully", null));
  } catch (error) {
    console.error(error);
    res.json(Formatter.badRequest());
  }
};

const createNewRole = async (req, res) => {
  try {
    if (!req.body.name) throw new Error("Name is empty");

    let newRole = await RoleRepository.upsertRole(req.body);
    res.json(Formatter.success("create_new_role_successfully", newRole));
  } catch (error) {
    console.error(error);
    res.json(Formatter.badRequest());
  }
};

const updateProjectById = async (req, res) => {
  try {
    if (!req.body.name) throw new Error("Name is empty");

    await ProjectRepository.upsertProject(req.body);
    res.json(Formatter.success("update_atv_project_successfully", null));
  } catch (error) {
    console.error(error);
    res.json(Formatter.badRequest());
  }
};

const getListProjectATV = async (req, res) => {
  let projects = await ProjectRepository.getListProjectATV();
  return res.json(Formatter.success(null, projects));
};

const deprecateATVProjectById = async (req, res) => {
  const { id } = req.params;
  try {
    await ProjectRepository.deprecateATVProjectById(id);
    res.json(Formatter.success("deprecate_atv_project_successfully", null));
  } catch (error) {
    console.error(error);
    res.json(Formatter.badRequest());
  }
};

const createNewATVProject = async (req, res) => {
  try {
    if (!req.body.name) throw new Error("Name is empty");

    let newRole = await ProjectRepository.upsertProject(req.body);
    res.json(Formatter.success("create_new_atv_project_successfully", newRole));
  } catch (error) {
    console.error(error);
    res.json(Formatter.badRequest());
  }
};

const getProjectByProjectId = async (req, res) => {
  const { id } = req.params;
  try {
    let record = await ProjectRepository.getProjectByProjectId(id);
    res.json(Formatter.success(null, record));
  } catch (error) {
    console.error(error);
    res.json(Formatter.badRequest());
  }
};

module.exports = {
  getListLeader,
  restoreUserById,
  getAllUser,
  getAllUserProject,

  updateRoleById,
  deprecateRoleById,
  restoreRoleById,
  createNewRole,

  getProjectByProjectId,
  updateProjectById,
  getListProjectATV,
  deprecateATVProjectById,
  createNewATVProject
};
