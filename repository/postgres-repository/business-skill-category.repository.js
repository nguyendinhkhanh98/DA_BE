const knex = require("../../config/database.js");

module.exports.getBusinessSkillCategories = () => {
  return bodyGetDataBusinessSkillCategory().orderBy("sort");
};

module.exports.upsertBusinessSkillCategory = (id, name, description, sort, delete_flag) => {
  description = description ? description : null;
  let isCreate = ["add", null, undefined].includes(id);

  if (!isCreate) return knex("business_skill_category").update({ name, description, sort, delete_flag }).where({ id });
  return knex("business_skill_category").insert({ name, description }).returning("*");
};

module.exports.getBusinessSkillCategoryById = id => {
  return bodyGetDataBusinessSkillCategory().where({ id });
};

module.exports.removeCategoryOfBusinessSkill = id => {
  return knex.transaction(async trx => {
    await trx("business_skill").where("category_id", id).update({
      category_id: null
    });

    await trx("business_skill_category").where("id", id).delete();
  });
};

const bodyGetDataBusinessSkillCategory = () => {
  return knex("business_skill_category").select();
};
