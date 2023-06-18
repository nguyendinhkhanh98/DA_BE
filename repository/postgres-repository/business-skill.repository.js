const knex = require("../../config/database.js");
const { statusSkill, changeStatus } = require("../../utils/business-skill-set/business.utils");

module.exports.getAllBusinessSkill = () => {
  return knex("business_skill")
    .select({
      skill_id: "business_skill.id",
      skill_name: "business_skill.name",
      skill_description: "business_skill.description",
      skill_delete_flag: "business_skill.delete_flag",

      category_id: "business_skill_category.id",
      category_name: "business_skill_category.name",
      category_description: "business_skill_category.description",
      category_delete_flag: "business_skill_category.delete_flag"
    })
    .fullOuterJoin("business_skill_category", "business_skill_category.id", "business_skill.category_id")
    .orderBy("sort");
};

module.exports.updateCategoryBusinessSkill = categories => {
  return knex.transaction(async trx => {
    for (let index = 0; index < categories.editedCategories.length; index++) {
      const category = categories.editedCategories[index];
      await trx("business_skill_category")
        .where("id", category.category_id)
        .update({
          name: category.category_name,
          description: category.category_description,
          sort: index + 1
        });
    }
    for (let index = 0; index < categories.skillEdited.length; index++) {
      const skill = categories.skillEdited[index];
      await trx("business_skill").where("id", skill.skill_id).update({
        category_id: skill.category_id
      });
    }
  });
};

module.exports.updateArchiveBusinessSkill = (id, flag) => {
  return knex("business_skill").where("id", id).update({
    delete_flag: flag
  });
};

module.exports.upsertBusinessSkill = ({ id, name, description, category_id, delete_flag }) => {
  description = description ? description : null;
  category_id = category_id ? category_id : null;
  let isCreate = ["add", null, undefined].includes(id);

  if (!isCreate) return knex("business_skill").update({ name, description, category_id, delete_flag }).where({ id });
  return knex("business_skill").insert({ name, description, category_id }).returning("*");
};

//assessment business skill

module.exports.getBusinessLevels = () => {
  return knex("business_levels");
};

module.exports.createAssessment = (user_id, { period, data, mode }) => {
  return new Promise((resolve, reject) => {
    knex.transaction(async trx => {
      try {
        let userPeriods = await trx("business_user_period")
          .insert({
            period_id: period.period_id,
            user_id: user_id,
            leader_id: period.leader_id,
            status: mode == "create" ? statusSkill.WaittingReview : statusSkill.Draft
          })
          .returning("id");
        await insertToBusinessSkill(trx, data, userPeriods[0]);

        resolve(userPeriods[0]);
      } catch (error) {
        reject(error);
      }
    });
  });
};

//ultis function
const updateInfoAssessment = (trx, leader_id, id) => {
  return trx("business_user_period").update("leader_id", leader_id).where("id", id);
};

const updateStatus = (trx, status, id) => {
  return trx("business_user_period").update("status", status).where("id", id);
};
const insertToBusinessSkill = async (trx, listSkill, id) => {
  for (let index = 0; index < listSkill.length; index++) {
    const skill = listSkill[index];
    options = {
      user_period_id: id,
      business_skill_id: parseInt(skill.skill_id),
      experience_time: skill.experience_time,
      level: skill.level
    };
    await trx("business_skill_set").insert(options);
  }
};

module.exports.getEvaluationAvailability = async (userId, periodId) => {
  let existedSubmissions = await knex("business_user_period")
    .select("id")
    .where("period_id", "=", periodId)
    .andWhere("user_id", "=", userId);
  return !existedSubmissions.length;
};

module.exports.updateAssessment = ({ id, period, data, mode, status, leader_id }) => {
  return new Promise((resolve, reject) => {
    knex.transaction(async trx => {
      try {
        if (status) await updateStatus(trx, status, id);
        if (leader_id) await updateInfoAssessment(trx, leader_id, id);

        let options;
        switch (mode) {
          case changeStatus.updateDraft:
          case changeStatus.draftToWaiting:
            await trx("business_skill_set").delete().where("user_period_id", id);
            await insertToBusinessSkill(trx, data, id);
            await trx("business_skill_set").insert(options);
            break;
          case changeStatus.approve:
            for (let index = 0; index < data.length; index++) {
              const skill = data[index];
              options = {
                level_review: skill.level_review,
                note: skill.note
              };
              await trx("business_skill_set")
                .update(options)
                .where({ user_period_id: id, business_skill_id: parseInt(skill.skill_id) });
            }
        }

        resolve(id);
      } catch (error) {
        reject(error);
      }
    });
  });
};

module.exports.getAvaiablePeriodByUserId = async user_id => {
  return knex
    .with("period_empty", knex.raw(`select distinct period_id from business_user_period where user_id = ${user_id}`))
    .select("*")
    .from("period")
    .leftJoin("period_empty", "period.id", "period_empty.period_id")
    .where({ "period_empty.period_id": null, "period.delete_flag": false })
    .whereRaw("CURRENT_DATE between start_date and end_date")
    .orderBy("created_at", "desc");
};

module.exports.getAllPeriod = () => {
  return knex("period").select("*");
};

module.exports.getAssessmentApprovedByUserID = async (user_id, business_user_period_id) => {
  let isCreate = ["add", null, undefined].includes(business_user_period_id);
  if (isCreate) {
    return knex("business_user_period")
      .where({ user_id: user_id, status: statusSkill.Approved })
      .orderBy("created_at", "desc");
  } else {
    return knex("business_user_period")
      .where({ user_id: user_id, status: statusSkill.Approved })
      .andWhere("id", "<", business_user_period_id)
      .orderBy("created_at", "desc");
  }
};
