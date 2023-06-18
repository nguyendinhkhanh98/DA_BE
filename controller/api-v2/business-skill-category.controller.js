const Formatter = require("response-format");
const Repository = require("../../repository/postgres-repository/business-skill-category.repository");
const APIErrorWithKnex = require("../../utils/APIException/APIErrorWithKnex");

module.exports.getBusinessSkillCategories = async (req, res, next) => {
  try {
    let categories = await Repository.getBusinessSkillCategories();
    res.json(Formatter.success(null, categories));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.createBusinessSkillCategory = async (req, res, next) => {
  let { id, name, description, sort } = req.body;
  try {
    let newCategory = await Repository.upsertBusinessSkillCategory(id, name, description, sort);
    res.json(Formatter.success("create_business_skill_category_successfully", newCategory));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.getBusinessSkillCategory = async (req, res, next) => {
  let { id } = req.params;
  try {
    let category = await Repository.getBusinessSkillCategoryById(id);
    res.json(Formatter.success(null, category));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.updateBusinessSkillCategoryById = async (req, res, next) => {
  let { id } = req.params;
  let { name, description, sort, delete_flag } = req.body;
  try {
    let newCategory = await Repository.upsertBusinessSkillCategory(id, name, description, sort, delete_flag);
    res.json(Formatter.success("update_business_skill_category_successfully", newCategory));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.removeCategoryOfBusinessSkill = async (req, res, next) => {
  try {
    await Repository.removeCategoryOfBusinessSkill(req.params.id);
    res.json(Formatter.success("delete_business_skill_category_successfully", null));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};
