const knex = require("../../config/database.js");

const getDraftSkillSetByPeriodId = period_id => {
  return knex
    .with("temp_period", knex.raw(`select * from user_period where id=${period_id}`))
    .column(
      "skill.id",
      "skill.name",
      "skill_set.experience_time",
      "skill_set.level",
      "skill_set.level_review",
      "skill_set.note",
      {
        skill_set_id: "skill_set.id",
        category: "skill_category.name",
        category_description: "skill_category.description",
        skill_description: "skill.description"
      }
    )
    .select()
    .from("temp_period")
    .leftJoin("skill_set", "skill_set.user_period_id", "temp_period.id")
    .leftJoin("skill", "skill.id", "skill_set.skill_id")
    .leftJoin("skill_category", "skill_category.id", "skill.category_id")
    .whereNotNull("skill.category_id")
    .orderBy("skill_category.sort");
};

const getLatestSkillSetByPeriodId = (period_id, user_id) => {
  return knex
    .with(
      "temp_period",
      knex.raw(`select * from user_period where id<${period_id} and user_id=${user_id} order by id desc limit 1`)
    )
    .column(
      "skill.id",
      "skill.name",
      "skill_set.experience_time",
      "skill_set.level",
      "skill_set.level_review",
      "skill_set.note",
      {
        skill_set_id: "skill_set.id",
        category: "skill_category.name",
        category_description: "skill_category.description",
        skill_description: "skill.description"
      }
    )
    .select()
    .from("temp_period")
    .leftJoin("skill_set", "skill_set.user_period_id", "temp_period.id")
    .leftJoin("skill", "skill.id", "skill_set.skill_id")
    .leftJoin("skill_category", "skill_category.id", "skill.category_id")
    .whereNotNull("skill.category_id")
    .orderBy("skill_category.sort");
};

const getListSkillSetWithNullValue = () => {
  return knex.raw(`select 
    skill.id,
    skill.name,
    skill_category.name as category,
    null as experience_time,
    null as level,
    null as level_review,
    null as note,
    skill_category.description as category_description,
    skill.description as skill_description
  from skill
  left join skill_category
  on skill_category.id = skill.category_id
  where skill.category_id is not null
  order by skill_category.sort`);
};

const updatePeriod = (id, name, start_date, end_date, description) => {
  return knex("period")
    .update({
      name,
      start_date,
      end_date,
      description
    })
    .where({ id });
};

const deleteLogicPeriod = period_id => {
  return knex("period")
    .update({
      delete_flag: true
    })
    .where({ id: period_id });
};

const deleteHardPeriod = period_id => {
  return knex("period").delete().where({ id: period_id });
};

const getAllPeriod = () => {
  return knex.select("*").from("period").orderBy("created_at", "desc");
};

const restorePeriod = period_id => {
  return knex("period")
    .update({
      delete_flag: false
    })
    .where({ id: period_id });
};

const getAllDevUser = () => {
  return knex
    .select("user_profile.full_name", "user_profile.id")
    .distinctOn("user_profile.id")
    .from("user_profile")
    .innerJoin("user_role", "user_role.user_id", "user_profile.id")
    .innerJoin("role", "role.id", "user_role.role_id")
    .innerJoin("user", "user.id", "user_profile.id")
    .whereRaw(`(role.name = 'developer' OR role.name = 'tester') AND "user".delete_flag = false`);
};

const getAllSkillSetByPeriodAndUser = (period_id, user_id) => {
  return knex("user_period")
    .column(
      { period: "period.name" },
      "period.start_date",
      "period.end_date",
      {
        user: "u1.full_name",
        leader: "u2.full_name",
        skill: "skill.name",
        category: "skill_category.name"
      },
      "skill_set.experience_time",
      "skill_set.level",
      "skill_set.level_review",
      "skill_set.note"
    )
    .select()
    .leftJoin("period", "period.id", "user_period.period_id")
    .leftJoin("skill_set", "skill_set.user_period_id", "user_period.id")
    .leftJoin("user_profile as u1", "u1.id", "user_period.user_id")
    .leftJoin("user_profile as u2", "u2.id", "user_period.leader_id")
    .leftJoin("skill", "skill.id", "skill_set.skill_id")
    .leftJoin("skill_category", "skill.category_id", "skill_category.id")
    .where({ period_id })
    .whereIn("user_id", user_id)
    .orderBy("period");
};

const getAllSkillSetSummary = async user_id => {
  let maxPeriod = await knex("period").max("start_date").where({ delete_flag: false }).first();
  let newestStartDate = maxPeriod.max;
  let allESkillSummary = await knex("user_period")
    .column(
      { period: "period.name" },
      "period.start_date",
      "period.end_date",
      {
        user: "u1.full_name",
        user_id: "u1.id",
        leader: "u2.full_name",
        skill: "skill.name",
        category: "skill_category.name"
      },
      "skill_set.experience_time",
      "skill_set.level_review"
    )
    .select()
    .leftJoin("period", "period.id", "user_period.period_id")
    .leftJoin("skill_set", "skill_set.user_period_id", "user_period.id")
    .leftJoin("user_profile as u1", "u1.id", "user_period.user_id")
    .leftJoin("user_profile as u2", "u2.id", "user_period.leader_id")
    .leftJoin("skill", "skill.id", "skill_set.skill_id")
    .leftJoin("skill_category", "skill.category_id", "skill_category.id")
    .where({ "period.start_date": newestStartDate })
    .whereIn("u1.id", user_id)
    .orderBy("period");
  let allBSkillSummary = await knex("business_user_period")
    .column(
      { period: "period.name" },
      "period.start_date",
      "period.end_date",
      {
        user: "u1.full_name",
        user_id: "u1.id",
        leader: "u2.full_name",
        skill: "business_skill.name",
        category: "business_skill_category.name"
      },
      "business_skill_set.experience_time",
      "business_skill_set.level_review"
    )
    .select()
    .leftJoin("period", "period.id", "business_user_period.period_id")
    .leftJoin("business_skill_set", "business_skill_set.user_period_id", "business_user_period.id")
    .leftJoin("user_profile as u1", "u1.id", "business_user_period.user_id")
    .leftJoin("user_profile as u2", "u2.id", "business_user_period.leader_id")
    .leftJoin("business_skill", "business_skill.id", "business_skill_set.business_skill_id")
    .leftJoin("business_skill_category", "business_skill.category_id", "business_skill_category.id")
    .where({ "period.start_date": newestStartDate })
    .whereIn("u1.id", user_id)
    .orderBy("period");
  return allESkillSummary.concat(allBSkillSummary);
};

const getAllSkill = () => {
  return knex("skill")
    .column({
      skill: "skill.name",
      category: "skill_category.name"
    })
    .select()
    .leftJoin("skill_category", "skill.category_id", "skill_category.id")
    .where({ "skill.delete_flag": false, "skill_category.delete_flag": false })
    .orderBy("category");
};

const getAllBusinessSkill = () => {
  return knex("business_skill")
    .column({
      skill: "business_skill.name",
      category: "business_skill_category.name"
    })
    .select()
    .leftJoin("business_skill_category", "business_skill.category_id", "business_skill_category.id")
    .where({ "business_skill.delete_flag": false, "business_skill_category.delete_flag": false })
    .orderBy("category");
};

const selectUserPeriodByPeriodId = period_id => {
  return knex("user_period").select().where({ period_id });
};

const getSkillSetByUserPeriodId = user_period_id => {
  return getBodyQueryUserPeriod().where({ "user_period.id": user_period_id, "period.delete_flag": false });
};

const getSkillSetByUserRole = ({ user_id, isAdmin, isLeader }) => {
  let conditionFilterPeriodLederUser = {
    "period.delete_flag": false,
    "user01.delete_flag": false,
    "user02.delete_flag": false
  };
  return getBodyQueryUserPeriod().where(builder => {
    if (isAdmin) return builder.where({ ...conditionFilterPeriodLederUser });

    if (isLeader)
      return builder
        .where({ "user_period.user_id": user_id, ...conditionFilterPeriodLederUser })
        .orWhere({ "user_period.leader_id": user_id, ...conditionFilterPeriodLederUser });

    return builder.where({ "user_period.user_id": user_id, ...conditionFilterPeriodLederUser });
  });
  // .orderBy("period.name");
};

const getLatestSkillSetApproved = user_id => {
  return getLatestUserPeriodApproved(user_id)
    .column("skill.id", "skill.name", "skill_set.experience_time", "skill_set.level_review", "skill_set.note", {
      level: "skill_set.level_review",
      category: "skill_category.name",
      category_description: "skill_category.description",
      skill_description: "skill.description"
    })
    .select()
    .from("temp_period")
    .leftJoin("skill_set", "skill_set.user_period_id", "temp_period.id")
    .leftJoin("skill", "skill.id", "skill_set.skill_id")
    .leftJoin("skill_category", "skill_category.id", "skill.category_id")
    .whereNotNull("skill.category_id")
    .orderBy("skill_category.sort");
};

const getLatestSkillSetCreated = (user_id, user_period_id) => {
  return getLatestUserPeriodCreated(user_id, user_period_id)
    .column(
      "skill.id",
      "skill.name",
      "skill_set.experience_time",
      "skill_set.level",
      "skill_set.level_review",
      "skill_set.note",
      {
        skill_set_id: "skill_set.id",
        category: "skill_category.name",
        category_description: "skill_category.description",
        skill_description: "skill.description"
      }
    )
    .select()
    .from("temp_period")
    .leftJoin("skill_set", "skill_set.user_period_id", "temp_period.id")
    .leftJoin("skill", "skill.id", "skill_set.skill_id")
    .leftJoin("skill_category", "skill_category.id", "skill.category_id")
    .whereNotNull("skill.category_id")
    .orderBy("skill_category.sort");
};

const getLatestSkillSetByUserPeriodId = user_period_id => {
  return knex
    .columns(
      "skill.id",
      "skill.name",
      "skill_set.experience_time",
      "skill_set.level",
      "skill_set.level_review",
      "skill_set.note",
      {
        category_description: "skill_category.description",
        skill_description: "skill.description",
        skill_set_id: "skill_set.id",
        category: "skill_category.name"
      }
    )
    .select()
    .from("skill_set")
    .leftJoin("skill", "skill.id", "skill_set.skill_id")
    .leftJoin("skill_category", "skill_category.id", "skill.category_id")
    .where({ user_period_id })
    .whereNotNull("skill.category_id")
    .orderBy([{ column: "skill_set.experience_time", order: "desc" }, "skill_set.level", "skill_category.sort"]);
};

// Utils function
const getBodyQueryUserPeriod = () => {
  return knex("user_period")
    .column(
      "user_period.created_at",
      "user_period.id",
      "user_period.status",
      "user_period.period_id",
      "user_period.leader_id",
      "user_period.user_id",
      {
        period_name: "period.name",
        user_created: "u1.full_name",
        leader: "u2.full_name",
        user_delete_flag: "user01.username",
        leader_delete_flag: "user02.username"
      }
    )
    .select()
    .leftJoin("period", "period.id", "user_period.period_id")
    .leftJoin("user_profile as u1", "u1.id", "user_period.user_id")
    .leftJoin("user_profile as u2", "u2.id", "user_period.leader_id")
    .leftJoin("user as user01", "user01.id", "u1.id")
    .leftJoin("user as user02", "user02.id", "u2.id");
};

const getLatestUserPeriodApproved = user_id => {
  return knex.with(
    "temp_period",
    knex.raw(
      `select * from user_period where user_id= ${user_id} and status='Approved' 
      order by id desc limit 1`
    )
  );
};

const getLatestUserPeriodCreated = (user_id, user_period_id) => {
  return knex.with(
    "temp_period",
    knex.raw(
      `select * from user_period where user_id=${user_id} and id<=${user_period_id} 
      order by id desc limit 1 offset 1`
    )
  );
};

const upsertSkill = (id, name, category_id, description) => {
  return knex.transaction(async trx => {
    let skillInDB = await trx("skill").select("*").where({ id });
    if (skillInDB && skillInDB.length) {
      await trx("skill")
        .update({
          name,
          category_id,
          description
        })
        .where({ id });
    } else {
      await trx("skill").insert({
        name,
        category_id,
        description
      });
    }
  });
};

const getListSkillDeletedAndEmptyInSkillSet = () => {
  return knex("skill")
    .column({
      skill_id: "skill.id",
      skill_set_id: "skill_set.id"
    })
    .select()
    .leftJoin("skill_set", "skill.id", "skill_set.skill_id")
    .where("skill.delete_flag", true)
    .whereNull("skill_set.id");
};

const cleanupSkillDeprecated = listSkillDeprecated => {
  return listSkillDeprecated.map(skill => {
    return knex("skill").delete().where({ id: skill.skill_id });
  });
};

const getLastAssessmentApprovedByUser = user_id => {
  return knex("user_period").select().where({ user_id, status: "Approved" }).orderBy("id", "desc");
};

const appendLatestAssessmentApproved = listUser => {
  return Promise.all(
    listUser.map(async user => {
      let latestAssessmentApproved = await getLastAssessmentApprovedByUser(user.id);
      if (latestAssessmentApproved.length) {
        user.latestAssessmentApproved = latestAssessmentApproved[0];
      }
      return user;
    })
  );
};

const getListSkillIdFromCategoryName = category_name => {
  return knex("skill_category")
    .columns({
      category: "skill_category.name",
      skill_id: "skill.id"
    })
    .select()
    .leftJoin("skill", "skill.category_id", "skill_category.id")
    .where({ "skill_category.name": category_name });
};

const getStrongCategoryBySkillAndUser = (user_period_id, listSkillId) => {
  return knex("skill_set")
    .column("skill_set.experience_time", {
      skill: "skill.name",
      level: "skill_set.level_review"
    })
    .select()
    .leftJoin("skill", "skill_set.skill_id", "skill.id")
    .where({ "skill_set.user_period_id": user_period_id, "skill.delete_flag": false })
    .whereIn("skill_set.skill_id", listSkillId)
    .orderBy([
      { column: "skill_set.level_review", order: "desc" },
      { column: "skill_set.experience_time", order: "desc" }
    ])
    .limit(5);
};

const appendSkillSetInfoToListUserProfile = (
  listUser,
  skillIdInLanguage,
  skillIdInFrameworks,
  skillIdInTechnologies
) => {
  return Promise.all(
    listUser.map(async user => {
      if (user.latestAssessmentApproved) {
        user.strongProgramingLanguage = await getStrongCategoryBySkillAndUser(
          user.latestAssessmentApproved.id,
          skillIdInLanguage
        );

        user.strongFrameworks = await getStrongCategoryBySkillAndUser(
          user.latestAssessmentApproved.id,
          skillIdInFrameworks
        );

        user.strongTechnologies = await getStrongCategoryBySkillAndUser(
          user.latestAssessmentApproved.id,
          skillIdInTechnologies
        );
      }

      return user;
    })
  );
};

const getListSkillDeletedWithAssessment = (user_period_id, listSkillExist) => {
  return knex("skill_set").select().where({ user_period_id }).whereNotIn("skill_id", listSkillExist);
};

const cleanupSkillSet = listOutOfList => {
  return knex.transaction(async trx => {
    let promises = listOutOfList.map(item => {
      return trx("skill_set").delete().where({ id: item.id });
    });
    await Promise.all(promises);
  });
};

const upsertSkillSet = (user_period_id, skill_id, experience_time, level) => {
  return knex.transaction(async trx => {
    let skillSetInDB = await trx("skill_set").select("*").where({ user_period_id, skill_id });
    if (skillSetInDB && skillSetInDB.length) {
      await trx("skill_set")
        .update({
          experience_time,
          level
        })
        .where({ id: skillSetInDB[0].id });
    } else {
      await trx("skill_set").insert({
        user_period_id,
        skill_id,
        experience_time,
        level
      });
    }
  });
};

const getUserPeriodByUserAndPeriod = ({ user_id, period_id }) => {
  return knex.select("*").from("user_period").where({ user_id, period_id });
};

const getListUserPeriodCompare = () => {
  return knex.raw(`
  select 
    user_period.id,
    user_profile.full_name || ' ' || period.name as user_period_name
  from user_period
  left join period
  on period.id = user_period.period_id
  left join "user"
  on "user".id = user_period.user_id
  left join user_profile
  on user_profile.id = user_period.user_id
  where period.delete_flag = false and "user".delete_flag = false and user_period.status = 'Approved'
  order by user_profile.full_name, period.name
  `);
};

const getListSkillTag = () => {
  return knex("skill_tag").select("*").orderBy("name");
};

const createSkillTag = (name, color) => {
  return knex("skill_tag").insert({ name, color }).returning("*");
};

const getSkillTagById = id => {
  return knex("skill_tag").select("*").where({ id });
};

const editSkillTag = (id, name, color) => {
  return knex("skill_tag").update({ name, color }).where({ id });
};

const deleteSkillTag = id => {
  return knex("skill_tag").delete().where({ id });
};

const getSkillExistTag = () => {
  return knex("skill").select("*").whereNotNull("skill.tag");
};

const updateSKillTag = (skillId, tag) => {
  return knex("skill").update({ tag }).where({ id: skillId });
};

const getLatestAssessmentApproved = async () => {
  let lastPeriodApproved = await getLastPeriodApproved();
  let listAssessment = await getAssessmentByPeriod(lastPeriodApproved);
  return listAssessment;
};

module.exports = {
  getDraftSkillSetByPeriodId,
  getLatestSkillSetByPeriodId,
  getAllSkillSetByPeriodAndUser,
  getAllSkillSetSummary,
  getAllSkill,
  getAllBusinessSkill,

  getListSkillSetWithNullValue,
  updatePeriod,
  deleteLogicPeriod,
  deleteHardPeriod,
  getAllPeriod,
  getAllDevUser,
  restorePeriod,

  selectUserPeriodByPeriodId,
  getSkillSetByUserPeriodId,
  getSkillSetByUserRole,

  getLatestSkillSetApproved,
  getLatestSkillSetCreated,
  getLatestSkillSetByUserPeriodId,

  upsertSkill,
  getListSkillDeletedAndEmptyInSkillSet,
  cleanupSkillDeprecated,
  getLastAssessmentApprovedByUser,
  appendLatestAssessmentApproved,
  getListSkillIdFromCategoryName,
  getStrongCategoryBySkillAndUser,
  appendSkillSetInfoToListUserProfile,
  getListSkillDeletedWithAssessment,
  cleanupSkillSet,
  upsertSkillSet,

  getUserPeriodByUserAndPeriod,
  getListUserPeriodCompare,

  getListSkillTag,
  createSkillTag,
  getSkillTagById,
  editSkillTag,
  deleteSkillTag,
  getSkillExistTag,
  updateSKillTag,

  getLatestAssessmentApproved
};

const getLastPeriodApproved = async () => {
  let res = await knex("user_period")
    .column("period_id")
    .select()
    .where({ status: "Approved" })
    .groupBy("period_id")
    .orderBy("period_id", "desc")
    .limit(1);

  return res[0].period_id;
};

const getAssessmentByPeriod = period_id => {
  return knex("user_period")
    .columns("user_profile.full_name", "skill_set.experience_time", "user_period.user_id", {
      skill_id: "skill.id",
      skill_name: "skill.name",
      level: "skill_set.level_review"
    })
    .leftJoin("skill_set", "skill_set.user_period_id", "user_period.id")
    .leftJoin("skill", "skill.id", "skill_set.skill_id")
    .leftJoin("user_profile", "user_profile.id", "user_period.user_id")
    .where({ period_id, status: "Approved", "skill.delete_flag": false });
};
