const Formatter = require("response-format");
const SkillSetRepository = require("../../repository/postgres-repository/skill-set.repository");
const HandleErrorKnex = require("../../utils/APIException/handleErrorKnex");
const APIErrorWithKnex = require("../../utils/APIException/APIErrorWithKnex");
const SkillSetEntity = require("../../entity/skill-set.entity");
const logger = require("../../utils/logger.js")(__filename);

const getSkillSetBySourceUserCompare = async (req, res) => {
  try {
    let { source, target } = req.body;

    let sourceSkillSet = await SkillSetRepository.getLatestSkillSetByUserPeriodId(source);
    let targetSkillSet = await SkillSetRepository.getLatestSkillSetByUserPeriodId(target);

    let resultData = {
      sourceSkillSet: sourceSkillSet,
      targetSkillSet: targetSkillSet
    };

    res.json(Formatter.success(null, resultData));
  } catch (error) {
    logger.error(error);
    res.json(Formatter.unavailable("Sorry, server busy!", null));
  }
};

const getListUserPeriodCompare = async (req, res) => {
  try {
    let listUserPeriod = await SkillSetRepository.getListUserPeriodCompare();

    res.json(Formatter.success(null, listUserPeriod.rows));
  } catch (error) {
    logger.error(error);
    res.json(Formatter.unavailable("Sorry, server busy!", null));
  }
};

const getListTag = async (req, res) => {
  try {
    let tags = await SkillSetRepository.getListSkillTag();
    res.json(Formatter.success(null, tags));
  } catch (error) {
    logger.error(error);
    res.json(Formatter.badRequest());
  }
};

const createSkillTag = async (req, res) => {
  const { name, color } = req.body;
  if (!name || !color) {
    return res.json(Formatter.badRequest("error_data_invalid", null));
  }
  try {
    let newTag = await SkillSetRepository.createSkillTag(name, color);
    res.json(Formatter.success("skill_tag_003_create_successfully", newTag));
  } catch (error) {
    HandleErrorKnex(res, error);
  }
};

const getSkillTagById = async (req, res) => {
  const { id } = req.params;
  try {
    let skillTag = await SkillSetRepository.getSkillTagById(id);
    res.json(Formatter.success(null, skillTag));
  } catch (error) {
    HandleErrorKnex(res, error);
  }
};

const editSkillTag = async (req, res) => {
  const { id } = req.params;
  const { name, color } = req.body;
  if (!name || !color) {
    return res.json(Formatter.badRequest("error_data_invalid", null));
  }

  try {
    let skillTag = await SkillSetRepository.editSkillTag(id, name, color);
    res.json(Formatter.success("skill_tag_001_update_successfully", skillTag));
  } catch (error) {
    HandleErrorKnex(res, error);
  }
};

const deleteSkillTag = async (req, res) => {
  const { id } = req.params;
  try {
    const originListSkillExistTag = await SkillSetRepository.getSkillExistTag();
    const listSkillCleanTag = originListSkillExistTag.filter(item => item.tag.includes(+id));
    const listSkillUnIncludeTag = listSkillCleanTag.map(item => {
      item.tag = item.tag.filter(tag => tag != +id);
      if (!item.tag.length) item.tag = null;
      else item.tag = JSON.stringify(item.tag);
      return item;
    });

    for (let index = 0; index < listSkillUnIncludeTag.length; index++) {
      const element = listSkillUnIncludeTag[index];
      await SkillSetRepository.updateSKillTag(element.id, element.tag);
    }

    await SkillSetRepository.deleteSkillTag(id);
    res.json(Formatter.success("skill_tag_002_delete_successfully", null));
  } catch (error) {
    HandleErrorKnex(res, error);
  }
};

const getLatestAssessmentApproved = async (req, res, next) => {
  try {
    const latestAssessmentApproved = await SkillSetRepository.getLatestAssessmentApproved();
    const assessmentExtracted = new SkillSetEntity().extractListAssessmentByUser(latestAssessmentApproved);
    res.json(Formatter.success(null, assessmentExtracted));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports = {
  getSkillSetBySourceUserCompare,
  getListUserPeriodCompare,

  getListTag,
  createSkillTag,
  getSkillTagById,
  editSkillTag,
  deleteSkillTag,

  getLatestAssessmentApproved
};
