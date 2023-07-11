const knex = require("../../config/database.js");

const createNewAccount = (payload, hashPassword) => {
  return knex
    .insert({
      username: payload.username,
      hash_password: hashPassword,
      email: payload.email,
      jira_email: payload.jira_email
    })
    .into("user")
    .returning("id");
};

const createUserProfileAndRole = (userId, payload) => {
  return knex.transaction(async trx => {
    let userRoleInfo = [];
    let userProjectInfo = [];
    if (payload.role && payload.role.length)
      userRoleInfo = payload.role.map(item => ({ user_id: userId, role_id: item }));
    if (payload.project && payload.project.length)
      userProjectInfo = payload.project.map(item => ({ user_id: userId, project_id: item }));
    return await Promise.all([
      trx
        .insert({
          id: userId,
          full_name: payload.fullName,
          address: payload.address,
          phone: payload.phone,
          cv: payload.cv
        })
        .into("user_profile"),
      trx.insert(userRoleInfo).into("user_role"),
      trx.insert(userProjectInfo).into("user_project")
    ]);
  });
};

const getUserListFullInfo = () => {
  return getBodyQueryUser().where({ "user.delete_flag": false }).orderBy("user.id");
};

const findUserInfo = user_id => {
  return getBodyQueryUser().where({ "user.id": user_id, "role.delete_flg": false });
};

const getUserIn = user_ids => {
  return knex
    .column("user.id", "username", "email", "address", "phone", "birthday", {
      fullName: "full_name",
      userId: "user.id",
      jira_email: "jira_email"
    })
    .select()
    .from("user")
    .leftJoin("user_profile", "user.id", "user_profile.id")
    .whereIn("user.id", user_ids);
};

const getBodyQueryUser = () => {
  return knex
    .column("user.id", "username", "email", "address", "phone", "birthday", "avatar", "role_id", "project_id", "cv", {
      fullName: "full_name",
      userId: "user.id",
      role: "role.name",
      jira_email: "user.jira_email",
      project: "task.name",
      delete_flag: "user.delete_flag",
      contentTask: "user_task_history.comment",
      status: "user_task_history.status",
      roleProject: "role_project.name",
      task_history_start: "user_task_history.start_date",
      task_history_end: "user_task_history.end_date"
    })
    .select()
    .from("user")
    .leftJoin("user_profile", "user.id", "user_profile.id")

    .leftJoin("user_role", "user.id", "user_role.user_id")
    .leftJoin("role", "user_role.role_id", "role.id")

    .leftJoin("user_project", "user.id", "user_project.user_id")
    .leftJoin("task", "task.id", "user_project.project_id")
    .leftJoin("user_task_history", "user_task_history.user_id", "user.id")
    .leftJoin("role_project", "user_project.role_project_id", "role_project.id")
};

const getBodyQueryUserProject = () => {
  return knex
    .column("id", "user_id", "project_id", "role_project_id", "jira_email")
    .select()
    .from("user_project")
};

const restoreUserById = user_id => {
  return knex("user").where({ "user.id": user_id }).update({ delete_flag: false });
};

const getAllUser = () => {
  return getBodyQueryUser().where({ "role.delete_flg": false }).orderBy("user.id");
};

const getAllUserProject = () => {
  return getBodyQueryUserProject().orderBy("id");
};

const getFullNameAndRole = () => {
  return knex
    .column("user.id", "full_name", { role: "role.name" })
    .select()
    .from("user")
    .leftJoin("user_profile", "user.id", "user_profile.id")
    .leftJoin("user_role", "user.id", "user_role.user_id")
    .leftJoin("role", "user_role.role_id", "role.id")
    .where({ "user.delete_flag": false });
};

const getUserById = id => {
  return knex.select().from("user").where({ id });
};

const getUserByUsernameOrEmail = username => {
  return knex
    .column("user.id", "username", "hash_password", "email", "address", "phone", "birthday", {
      permissions: "role.name",
      delete_flag: "user.delete_flag",
      fullName: "full_name"
    })
    .select()
    .from("user")
    .leftJoin("user_profile", "user.id", "user_profile.id")
    .leftJoin("user_role", "user.id", "user_role.user_id")
    .leftJoin("role", "user_role.role_id", "role.id")
    .where({ username })
    .orWhere({ email: username });
};

const getHashPasswordById = id => {
  return knex.select("hash_password").from("user").where({ id });
};

const update = (user, condition) => {
  return knex("user").where(condition).update(user);
};

const getDataFogotPassword = email => {
  return knex.column("id", "username", "email").select().from("user").where({ email });
};

const getAllUserInfo = () => {
  return knex
    .column("user.id", "username", "email", { fullName: "full_name" }, "address", "phone", "birthday", {
      role: "role.name"
    })
    .select()
    .from("user")
    .leftJoin("user_profile", "user.id", "user_profile.id")
    .leftJoin("user_role", "user.id", "user_role.user_id")
    .leftJoin("role", "user_role.role_id", "role.id");
};

const getUserProfileById = id => {
  return knex
    .column(
      "user.id",
      "username",
      "email",
      "user_profile.position",
      "user_profile.about",
      {
        fullName: "full_name",
        projectDescription: "user_profile.project_description",
        interestedProject: "user_profile.interested_project"
      },
      "address",
      "phone",
      "cv"
    )
    .select()
    .from("user")
    .leftJoin("user_profile", "user.id", "user_profile.id")
    .where({ "user.id": id });
};

const getListUserOnlyFullName = () => {
  return knex
    .select("user.id", "full_name")
    .from("user")
    .leftJoin("user_profile", "user_profile.id", "user.id")
    .where({ "user.delete_flag": false });
};

const getListUserWithNameAndEmail = () => {
  return knex
    .column("user.id", "email", {
      fullName: "full_name",
      jiraEmail: "jira_email"
    })
    .select()
    .from("user")
    .leftJoin("user_profile", "user.id", "user_profile.id")
    .orderBy(["user_profile.full_name"]);
};

const getUserByCondition = condition => {
  return knex.select().from("user").where(condition);
};

module.exports = {
  createNewAccount,
  createUserProfileAndRole,
  getUserListFullInfo,
  findUserInfo,
  restoreUserById,
  getAllUser,

  getAllUserProject,

  getFullNameAndRole,
  getUserById,
  getUserByUsernameOrEmail,
  getHashPasswordById,
  update,
  getDataFogotPassword,
  getAllUserInfo,
  getUserProfileById,
  getListUserOnlyFullName,
  getListUserWithNameAndEmail,
  getUserByCondition,
  getUserIn
};
