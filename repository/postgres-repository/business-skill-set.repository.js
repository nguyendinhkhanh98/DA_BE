const knex = require("../../config/database.js");

module.exports.getSkillOfAssessment = user_period_id => {
  return knex("business_skill_set").where("user_period_id", user_period_id);
};

module.exports.getLastLevelOfSkill = async user_period_id => {
  return knex("business_skill_set")
    .select("business_skill_id", "level_review", "experience_time")
    .where({ user_period_id });
};
