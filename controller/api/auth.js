const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const knex = require("../../config/database");
const { sendEmail } = require("../../service/email");
const JiraProjectRepository = require("../../repository/postgres-repository/jira-project.repository");
const UserRepository = require("../../repository/postgres-repository/user.repository");

const login = async (req, res) => {
  console.log('password', bcrypt.decodeBase64('$2a$10$cneLGjBFt43VI8L8Y3l0we1uWCcd4p1MLfE3m8pc2khY9HvUzO7u2'))
  const { username, password, jiraName } = req.body;
  const users = await UserRepository.getUserByUsernameOrEmail(username);

  if (!users.length) return res.status(401).json({ error: "User does not exist" });
  if (users[0].delete_flag) return res.status(401).json({ error: "Your account blocked! Please contact your leader" });

  const user = users[0];
  user.permissions = users.map(o => o.permissions);
  let resultCompare = await bcrypt.compare(password, user.hash_password);
  if (!resultCompare) {
    return res.status(401).json({
      error: "Password does not match"
    });
  }

  const jwtSecret = process.env.JWT_SECRET;
  user.hash_password = undefined;
  user.jiraUrl = await switchJiraUrl(jiraName);
  // 7 days
  const expireTokenDays = 7;
  const token = jwt.sign(user, jwtSecret, { expiresIn: expireTokenDays * 24 + "h" });
  res.cookie("token", token, {
    expire: new Date(Number(new Date()) + expireTokenDays * 24 * 60 * 60 * 1000)
  });
  return res.json(token);
};

const logout = async (req, res) => {
  res.clearCookie();
  return res.json({ message: "Logout success!" });
};

const changePassword = async (req, res) => {
  const { id } = req.user;
  const { password, newPassword } = req.body;
  // Check validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors);
  }
  // Check password match
  const hashPasswords = await UserRepository.getHashPasswordById(id);
  const hashPassword = hashPasswords[0].hash_password;
  bcrypt.compare(password, hashPassword, async function (err, result) {
    if (result) {
      const salt = bcrypt.genSaltSync(10);
      const newHashPassword = bcrypt.hashSync(newPassword, salt);
      await UserRepository.update({ hash_password: newHashPassword }, { id });
      return res.json({ message: "Change password success!" });
    } else {
      return res.status(400).json({ error: "Password does not match" });
    }
  });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const users = await UserRepository.getDataFogotPassword(email);
  if (!users.length) {
    return res.status(400).json({ error: "User does not exist" });
  }
  const user = users[0];
  // generate a token with user id and secret
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

  // email data
  const emailData = {
    from: "jira.qcd@gmail.com",
    to: email,
    subject: "[JIRA QCD] Password Reset Instructions",
    text: `Please use the following link to reset your password: ${process.env.CLIENT_URL}/reset-password?token=${token}`,
    html: `<p>Please use the following link to reset your password:</p> <p>${process.env.CLIENT_URL}/reset-password?token=${token}</p>`
  };
  sendEmail(emailData);
  return res.json({ message: `Email has been sent to ${email}. Follow the instructions to reset your password.` });
};

const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  jwt.verify(token, process.env.JWT_SECRET, async function (err, decoded) {
    if (err) {
      return res.status(400).json({ error: "Invalid token" });
    } else {
      const salt = bcrypt.genSaltSync(10);
      const hashPassword = bcrypt.hashSync(password, salt);
      await UserRepository.update({ hash_password: hashPassword }, { id: decoded.id });
      return res.json({ message: "Reset password success!" });
    }
  });
};

const switchJiraUrl = async jiraName => {
  let listJiraProject = await JiraProjectRepository.getListJiraProject();
  let jiraProject = listJiraProject.find(item => item.name == jiraName);

  if (jiraProject) return jiraProject.url;
};

module.exports = {
  login,
  logout,
  changePassword,
  forgotPassword,
  resetPassword
};
