const Formatter = require("response-format");
const Repository = require("../../repository/postgres-repository/business-skill.repository");
const BusinessSkillSetRepository = require("../../repository/postgres-repository/business-skill-set.repository");
const BusinessUserPeriodRepository = require("../../repository/postgres-repository/business-user-period.repository");
const APIErrorWithKnex = require("../../utils/APIException/APIErrorWithKnex");
const { statusSkill, changeStatus } = require("../../utils/business-skill-set/business.utils");
const knex = require("../../config/database");

module.exports.getAllBusinessSkill = async (req, res, next) => {
  try {
    let skills = await Repository.getAllBusinessSkill();
    res.json(Formatter.success(null, skills));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.updateCategoryBusinessSkill = async (req, res, next) => {
  try {
    let skillsAfterUpdate = await Repository.updateCategoryBusinessSkill(req.body);
    res.json(Formatter.success("update_business_skill_category_successfully", skillsAfterUpdate));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.createBusinessSkill = async (req, res, next) => {
  try {
    let newBusinessSkill = await Repository.upsertBusinessSkill(req.body);
    res.json(Formatter.success("create_business_skill_successfully", newBusinessSkill));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.archiveBusinessSkill = async (req, res, next) => {
  try {
    await Repository.updateArchiveBusinessSkill(req.params.id, true);
    res.json(Formatter.success("archive_business_skill_successfully", null));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.restoreBusinessSkill = async (req, res, next) => {
  try {
    await Repository.updateArchiveBusinessSkill(req.params.id, false);
    res.json(Formatter.success("restore_business_skill_successfully", null));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.updateBusinessSkill = async (req, res, next) => {
  try {
    await Repository.upsertBusinessSkill(req.body);
    res.json(Formatter.success("update_business_skill_successfully", null));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

//assessment business skill
module.exports.getAllBusinessSkillToAssessment = async (req, res, next) => {
  try {
    let listBusinessSkill = await Repository.getAllBusinessSkill();
    let listAssessmentApproved = await Repository.getAssessmentApprovedByUserID(req.user.id);
    if (listAssessmentApproved.length) {
      let lastLevelOfSkill = await BusinessSkillSetRepository.getLastLevelOfSkill(listAssessmentApproved[0].id);
      listBusinessSkill.forEach(skill => {
        lastLevelOfSkill.forEach(item => {
          if (skill.skill_id == item.business_skill_id) {
            skill.experience_time = item.experience_time;
            skill.level = item.level_review;
            skill.last_experience_time = item.experience_time;
            skill.last_level = item.level_review;
          }
        });
      });
    }

    res.json(Formatter.success(null, listBusinessSkill));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.getBusinessLevels = async (req, res, next) => {
  try {
    let levels = await Repository.getBusinessLevels();
    res.json(Formatter.success(null, levels));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.createAssessment = async (req, res, next) => {
  try {
    let canSubmit = await Repository.getEvaluationAvailability(req.user.id, req.body.period.period_id);
    if (!canSubmit) {
      res.json(Formatter.badRequest("Your submission for this period has already been recorded!", null));
      return;
    }
    let id = await Repository.createAssessment(req.user.id, req.body);
    let keyRes = "";
    if (req.body.mode == "create") keyRes = "create_assessment_business_skill_success";
    else keyRes = "save_draft_assessment_business_skill_success";
    res.json(Formatter.success(keyRes, id));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.updateAssessment = async (req, res, next) => {
  try {
    let id = await Repository.updateAssessment(req.body);
    switch (req.body.mode) {
      case changeStatus.updateDraft:
        res.json(Formatter.success("update_draft_assessment_business_skill_success", id));
        break;
      case changeStatus.draftToWaiting:
        res.json(Formatter.success("create_assessment_business_skill_success", id));
        break;
      default:
        res.json(Formatter.success("update_assessment_business_skill_success", id));
    }
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.getAvaiablePeriod = async (req, res, next) => {
  try {
    let periods;
    if (req.query.type == "add") {
      periods = await Repository.getAvaiablePeriodByUserId(req.user.id);
    } else {
      periods = await Repository.getAllPeriod();
    }
    res.json(Formatter.success(null, periods));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.getAssessmentInfo = async (req, res, next) => {
  try {
    let { user_period_id } = req.params;
    let infor = await BusinessUserPeriodRepository.getAssessmentInfo(user_period_id);
    if (!infor.length) return res.json(Formatter.notFound());
    let isUser = infor[0].user_id == req.user.id;
    let isLeader = infor[0].leader_id == req.user.id;
    let isAdmin = req.user.permissions.includes("admin") || req.user.permissions.includes("manager");
    if (!isUser && [statusSkill.Draft, statusSkill.Rejected].includes(infor[0].status)) {
      return res.status(403).json({ error: "Permission denied" });
    }
    if (isUser || isLeader || isAdmin) {
      res.json(Formatter.success(null, infor));
    } else {
      return res.status(403).json({ error: "Permission denied" });
    }
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.getAssessmentSkills = async (req, res, next) => {
  try {
    let { user_period_id } = req.params;
    let { user_id } = req.query;
    let listBusinessSkill = await Repository.getAllBusinessSkill();
    let skillOfAssessment = await BusinessSkillSetRepository.getSkillOfAssessment(user_period_id);
    if (!skillOfAssessment.length) {
      return res.json(Formatter.notFound());
    }
    let listAssessmentApproved = await Repository.getAssessmentApprovedByUserID(user_id, user_period_id);
    let lastLevelOfSkill = [];
    if (listAssessmentApproved.length)
      lastLevelOfSkill = await BusinessSkillSetRepository.getLastLevelOfSkill(listAssessmentApproved[0].id);

    listBusinessSkill.forEach(skill => {
      skillOfAssessment.forEach(item => {
        if (skill.skill_id == item.business_skill_id) {
          skill.experience_time = item.experience_time;
          skill.level = item.level;
          skill.level_review = item.level_review;
          skill.note = item.note;
        }
      });
      lastLevelOfSkill.forEach(item => {
        if (skill.skill_id == item.business_skill_id) {
          skill.last_experience_time = item.experience_time;
          skill.last_level = item.level_review;
        }
      });
    });
    res.json(Formatter.success(null, listBusinessSkill));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.getAllAssessment = async (req, res, next) => {
  try {
    let user_id = req.user.id;
    let isAdmin = req.user.permissions.includes("admin") || req.user.permissions.includes("manager");
    let isLeader = req.user.permissions.includes("leader");
    let allAssessmentByRole = await BusinessUserPeriodRepository.getAllUserPeriodByUserRole({
      user_id,
      isAdmin,
      isLeader
    });

    if (isAdmin || isLeader) {
      allAssessmentByRole = allAssessmentByRole.filter(item => {
        if ([statusSkill.Draft, statusSkill.Rejected].includes(item.status)) {
          if (item.user_id == user_id) return true;
          else return false;
        }

        return true;
      });
    }
    res.json(Formatter.success(null, allAssessmentByRole));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.updateBusinessLeaderById = async (req, res, next) => {
  try {
    let { id, leader_id } = req.body;
    let data = await knex("business_user_period").update({ leader_id: leader_id }).where("id", "=", id);
    res.json(Formatter.success("Updated successfully"));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};
