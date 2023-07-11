const bcrypt = require("bcryptjs");
const knex = require("../../config/database");
const { validationResult } = require("express-validator");
const fsExtra = require("fs-extra");
const fs = require("fs");
const { createNewUserMail } = require("../../service/email");
const UserRepository = require("../../repository/postgres-repository/user.repository");
const UserUtils = require("../../utils/user-management.util");
const RoleRepository = require("../../repository/postgres-repository/role.repository");
const ProjectRepository = require("../../repository/postgres-repository/project.repository");
const logger = require("../../utils/logger.js")(__filename);

const getUserList = async (req, res) => {
  let users = await UserRepository.getUserListFullInfo();
  users = UserUtils.extractUserList(users);

  return res.json(users);
};

const getRoleList = async (req, res) => {
  const roles = await RoleRepository.getListRoleOrderByName();
  return res.json(roles);
};

const getFullNameUser = async (req, res) => {
  const data = await UserRepository.getListUserOnlyFullName();
  return res.json(data);
};

const getUserWithNameAndEmail = async (req, res) => {
  const data = await UserRepository.getListUserWithNameAndEmail();
  return res.json(data);
};

const createNewUser = async (req, res) => {
  const payload = JSON.parse(req.body.payload);
  // Check validator
  const errors = validationResult(payload);
  if (!errors.isEmpty()) return res.status(400).json(errors);

  // Check user exist
  const users = await UserRepository.getUserByCondition({ username: payload.username });
  if (users.length) return res.status(400).json({ message: "User already in use" });

  // Create new user
  let { password } = payload;
  if (!password) password = generateRandomPassword();
  const salt = bcrypt.genSaltSync(10);
  const hashPassword = bcrypt.hashSync(password, salt);
  let userId = 0;

  try {
    const userIds = await UserRepository.createNewAccount(payload, hashPassword);
    console.log('userIds', userIds)
    userId = userIds[0];
  } catch (error) {
    logger.error(error);
    return res.status(400).json({ message: "User info duplicate" });
  }

  const processedFile = req.file;
  if (processedFile) payload.cv = processedFile.path;

  try {
    await UserRepository.createUserProfileAndRole(userId, payload);

    const mailSubject = "[JIRA QCD] Register successfully";
    const mailContent =
      '<p>Click <a href="https://qcd.arrow-tech.vn/login">here</a> to login with: </p>' +
      `<p>Username: ${payload.username}</p>` +
      `<p>Password: ${password}</p>`;
    createNewUserMail(payload.email, mailSubject, mailContent);
    return res.json({ message: "Create user successfully" });
  } catch (error) {
    logger.error(error);
    await knex("user").where({ id: userId }).del();
    res.status(400).json({ message: "Cannot create new account, info invalid" });
  }
};

const findUserById = async (req, res) => {
  const { id } = req.params;
  try {
    let data = await UserRepository.findUserInfo(id);
    if (data.length == 0) return res.status(400).json({ message: "User does not exist" });

    let dataExtract = UserUtils.extractOneUser(data);
    if (dataExtract.cv) {
      try {
        let CV = await fsExtra.readFile(`${dataExtract.cv}`);
        dataExtract.cv = CV;
      } catch (error) {
        dataExtract.cv = "";
      }
    }
    return res.json(dataExtract);
  } catch (error) {
    logger.error(error);
    return res.status(400).json({ message: "User does not exist" });
  }
};

const updateUserById = async (req, res) => {
  const { id } = req.params;
  const payload = JSON.parse(req.body.payload);
  const { password } = payload;
  let hashPassword;

  if (password) {
    const salt = bcrypt.genSaltSync(10);
    hashPassword = bcrypt.hashSync(password, salt);
  }

  try {
    const processedFile = req.file;
    let cv;
    if (processedFile) {
      // let orgName = processedFile.originalname
      const fullPathInServ = processedFile.path;
      // const newFullPath = `${fullPathInServ}-${orgName}`;
      cv = fullPathInServ;
      let data = await knex.select("cv").from("user_profile").where({ id });
      if (data && data[0].cv) {
        try {
          await fs.unlinkSync(data[0].cv);
        } catch (error) {
          logger.error("Cannot unlink sync");
        }
      }
    }

    await knex.transaction(async trx => {
      let emailInfo = { email: payload.email, jira_email: payload.jira_email };
      let userRoleInfo = payload.role.map(item => ({ user_id: id, role_id: item }));
      let userProjectInfo = payload.project.map(item => ({ user_id: id, project_id: item }));
      let userProfileObject = {
        full_name: payload.fullName,
        phone: payload.phone,
        address: payload.address
      };
      if (cv) userProfileObject.cv = cv;

      await Promise.all([
        trx("user_profile").where({ id }).update(userProfileObject),

        trx("user_role").where({ user_id: id }).del(),
        trx.insert(userRoleInfo).into("user_role"),

        trx("user_project").where({ user_id: id }).del(),
        trx.insert(userProjectInfo).into("user_project"),

        trx("user")
          .where({ id })
          .update(password ? { ...emailInfo, hash_password: hashPassword } : { ...emailInfo })
      ]);
      res.json({ message: "Update info successful!" });
    });
  } catch (error) {
    logger.error(error);
    res.status(400).send({ message: "Failed update user info!" });
  }
};

const deleteUserById = async (req, res) => {
  const { id } = req.params;
  // let data = await knex.select("cv").from("user_profile").where({ id });
  // if (data[0].cv) {
  //   try {
  //     fs.unlinkSync(data[0].cv);
  //   } catch (error) {
  //     logger.error(error);
  //   }
  // }

  await knex("user").where({ id: id }).update({ delete_flag: true });
  return res.json({ message: "Block user successfully" });
};

const generateRandomPassword = () => {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const getProjectList = async (req, res) => {
  let data = await ProjectRepository.getProjectByCondition({ delete_flag: false });
  res.json(data);
};

module.exports = {
  getUserList,
  getFullNameUser,
  getUserWithNameAndEmail,
  getRoleList,
  getProjectList,

  findUserById,
  createNewUser,
  updateUserById,
  deleteUserById
};
