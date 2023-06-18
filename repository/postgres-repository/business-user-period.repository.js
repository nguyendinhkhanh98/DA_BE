const { select } = require("../../config/database.js");
const knex = require("../../config/database.js");

module.exports.getAssessmentApprovedByPeriodId = period_id => {
  return knex("business_user_period")
    .columns("user_profile.full_name", "business_skill_set.experience_time", "business_user_period.user_id", {
      skill_id: "business_skill.id",
      skill_name: "business_skill.name",
      level: "business_skill_set.level_review"
    })
    .leftJoin("business_skill_set", "business_skill_set.user_period_id", "business_user_period.id")
    .leftJoin("business_skill", "business_skill.id", "business_skill_set.business_skill_id")
    .leftJoin("user_profile", "user_profile.id", "business_user_period.user_id")
    .where({ period_id, status: "Approved", "business_skill.delete_flag": false });
};

module.exports.getAssessmentApprovedOfAllUser = () => {
  let rawQuery = knex.raw(`
  select full_name, u.*, business_skill_id, bss.level_review, bs.name
  from business_user_period u
           inner join (select business_user_period.user_id, max(business_user_period.created_at) as maxCreatedAt
                       from business_user_period
                       group by business_user_period.user_id) as lastApproved
                      on u.user_id = lastApproved.user_id and u.created_at = lastApproved.maxCreatedAt
           left join user_profile up on u.user_id = up.id
           left join "user" on u.user_id = "user".id
           left join business_skill_set bss on u.id = bss.user_period_id
           left join business_skill bs on bs.id = bss.business_skill_id
  where u.status = 'Approved' and "user".delete_flag = false and bs.delete_flag = false
    `);
  return knex
    .with("last_approved", rawQuery)
    .columns("full_name", "user_id", {
      skill_id: "business_skill_id",
      skill_name: "name",
      level: "level_review"
    })
    .from("last_approved");
};

module.exports.getAssessmentInfo = user_period_id => {
  return getBodyQueryUserPeriod().where({ "business_user_period.id": user_period_id, "period.delete_flag": false });
};

module.exports.getAllUserPeriodByUserRole = ({ user_id, isAdmin, isLeader }) => {
  let conditionFilterPeriodLederUser = {
    "period.delete_flag": false,
    "user01.delete_flag": false,
    "user02.delete_flag": false
  };
  return getBodyQueryUserPeriod().where(builder => {
    if (isAdmin) return builder.where({ ...conditionFilterPeriodLederUser });

    if (isLeader)
      return builder
        .where({ "business_user_period.user_id": user_id, ...conditionFilterPeriodLederUser })
        .orWhere({ "business_user_period.leader_id": user_id, ...conditionFilterPeriodLederUser });

    return builder.where({ "business_user_period.user_id": user_id, ...conditionFilterPeriodLederUser });
  });
  // .orderBy("period.name");
};

const getBodyQueryUserPeriod = () => {
  return knex("business_user_period")
    .column(
      "business_user_period.created_at",
      "business_user_period.id",
      "business_user_period.status",
      "business_user_period.period_id",
      "business_user_period.leader_id",
      "business_user_period.user_id",
      {
        period_name: "period.name",
        user_created: "u1.full_name",
        leader: "u2.full_name",
        user_delete_flag: "user01.username",
        leader_delete_flag: "user02.username"
      }
    )
    .select()
    .leftJoin("period", "period.id", "business_user_period.period_id")
    .leftJoin("user_profile as u1", "u1.id", "business_user_period.user_id")
    .leftJoin("user_profile as u2", "u2.id", "business_user_period.leader_id")
    .leftJoin("user as user01", "user01.id", "u1.id")
    .leftJoin("user as user02", "user02.id", "u2.id");
};
