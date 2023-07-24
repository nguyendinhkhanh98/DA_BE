const knex = require("../../config/database.js");
const fs = require("fs");
const logger = require("../../utils/logger.js")(__filename);

const unlinkOldCV = async user_id => {
  let userData = await knex.select("cv").from("user_profile").where({ id: user_id });

  if (userData.length && userData[0].cv) {
    try {
      fs.unlinkSync(userData[0].cv);
    } catch (error) {
      logger.error(error);
    }
  }
};

const updateUserProfile = (user_id, userProfileData, userData) => {
  return knex.transaction(async trx => {
    let tasks = [];

    tasks.push(trx("user_profile").where({ id: user_id }).update(userProfileData));
    tasks.push(trx("user").where({ id: user_id }).update(userData));

    await Promise.all(tasks);
  });
};

const getListUserProfileByUserId = listUserId => {
  return knex("user_profile").select().whereIn("id", listUserId);
};

const updateUserProfileGeneralScore = (generalScore , id) => {
  return knex("user_profile").where({ id: parseInt(id) }).update({ general_score: generalScore })
};

module.exports = {
  unlinkOldCV,
  updateUserProfile,

  getListUserProfileByUserId,
  updateUserProfileGeneralScore
};
