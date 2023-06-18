const knex = require("../../config/database");
const { validationResult } = require("express-validator");
const fsExtra = require("fs-extra");
const ProfileRepository = require("../../repository/postgres-repository/user-profile.repository");
const UserRepository = require("../../repository/postgres-repository/user.repository");
const logger = require("../../utils/logger.js")(__filename);

const getProfile = async (req, res) => {
  const { id } = req.user;
  const users = await UserRepository.getUserProfileById(id);
  let user = users[0];
  if (user.cv) user.cv = await getBufferCV(user.cv);

  return res.json(user);
};

const getBufferCV = async path => {
  try {
    return await fsExtra.readFile(`${path}`);
  } catch (error) {
    logger.error(error);
    return "";
  }
};

const editProfile = async (req, res) => {
  const payload = JSON.parse(req.body.payload);
  const { fullName, email, address, phone, position, about, projectDescription, interestedProject } = payload;

  // Check validator
  const errors = validationResult(req.body);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors);
  }

  try {
    const processedFile = req.file;
    let userProfileData = {
      full_name: fullName,
      address,
      phone,
      position,
      about,
      interested_project: interestedProject,
      project_description: projectDescription
    };
    let userData = { email: email };

    if (processedFile) {
      await ProfileRepository.unlinkOldCV(req.user.id);
      userProfileData.cv = processedFile.path;
    }

    await ProfileRepository.updateUserProfile(req.user.id, userProfileData, userData);

    return res.json({ message: "Update profile success!" });
  } catch (error) {
    logger.error(error);
    return res.status(400).json({ error: error.detail });
  }
};

module.exports = {
  getProfile,
  editProfile
};
