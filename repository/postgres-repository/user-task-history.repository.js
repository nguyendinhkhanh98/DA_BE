const knex = require("../../config/database.js");

module.exports.getAllMemberTaskHistory = () => {
  return knex("user_task_history")
    .select("user_task_history.*", "user_profile.full_name", "task.name", {
      skill_id: "skill.id",
      skill_name: "skill.name",

      business_skill_id: "business_skill.id",
      business_skill_name: "business_skill.name"
    })
    .leftJoin("task", "task.id", "user_task_history.task_id")
    .leftJoin("user_profile", "user_profile.id", "user_task_history.user_id")

    .leftJoin("task_skill", "task_skill.task_id", "task.id")
    .leftJoin("skill", "skill.id", "task_skill.skill_id")

    .leftJoin("task_business_skill", "task_business_skill.task_id", "task.id")
    .leftJoin("business_skill", "business_skill.id", "task_business_skill.business_skill_id")
    .where("task.delete_flag", false);
};

module.exports.getAllHistoryByTaskId = id => {
  return bodyQuery().where("user_task_history.task_id", id);
};

module.exports.addOrCreateTaskHistory = ({ id, user_id, task_id, start_date, end_date, comment, attachment }) => {
  if (!id)
    return knex("user_task_history")
      .insert({ user_id, task_id, start_date, end_date, comment, attachment })
      .returning("*");
  return knex("user_task_history")
    .update({ user_id, task_id, start_date, end_date, comment, attachment })
    .where({ id })
    .returning("*");
};

module.exports.removeTaskHistory = historyId => {
  return knex("user_task_history").delete().where("id", historyId);
};

const bodyQuery = () => {
  return knex("user_task_history")
    .select("user_task_history.*", "user_profile.full_name")
    .leftJoin("task", "task.id", "user_task_history.task_id")
    .leftJoin("user_profile", "user_profile.id", "user_task_history.user_id");
};
