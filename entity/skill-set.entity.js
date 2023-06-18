const _ = require("lodash");

const extractUserSkill = userAssessment => {
  return userAssessment.map(item => {
    let { skill_id, skill_name, level } = item;
    return { skill_id, skill_name, level };
  });
};

class SkillSetEntity {
  extractListAssessmentByUser(listAssessment) {
    let listUniqUser = _.uniqBy(listAssessment, item => item.user_id);

    return listUniqUser.map(user => {
      let userAssessment = listAssessment.filter(item => item.user_id == user.user_id);
      return {
        user_id: user.user_id,
        full_name: user.full_name,
        skills: extractUserSkill(userAssessment)
      };
    });
  }
}

exports = module.exports = SkillSetEntity;
