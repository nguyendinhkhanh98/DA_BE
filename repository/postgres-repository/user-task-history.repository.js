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

module.exports.addOrCreateTaskHistory = async ({ id, user_id, task_id, start_date, end_date, comment, attachment, fileReport, status, score }) => {
  if (!id) {
    const createUserTaskHistory = await knex("user_task_history")
      .insert({ user_id, task_id, start_date, end_date, comment, attachment, fileReport, status, score })
      .returning("*");
    const project = await knex('task').select('*').where({ id: task_id})
    return knex("notification")
      .insert({ user_id, content: `Bạn được gán công việc mới trong project ${project?.[0]?.name}`, type: "assign", isRead: false })
  }
    
  return knex("user_task_history")
    .update({ user_id, task_id, start_date, end_date, comment, attachment, fileReport, status, score })
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

module.exports.getAllTaskHistoryByUserId = (userId) => {
  return knex("user_task_history")
  .column("start_date", "end_date", "status", "updated_at", "score", " comment", "attachment", "fileReport", { 
    fullName: "user_profile.full_name", projectName: "task.name", projectId: "task.id", roleName: "role_project.name", user_id: "user_profile.id", id: "user_task_history.id" }
  )
  .select()
  .innerJoin('user_profile', 'user_task_history.user_id', 'user_profile.id')
  .innerJoin('user_project', function() {
    this.on('user_task_history.task_id', 'user_project.project_id')
    .andOn('user_task_history.user_id', 'user_project.user_id')
  })
  .innerJoin('role_project', 'role_project.id', 'user_project.role_project_id')
  .innerJoin('task', 'task.id', 'user_task_history.task_id')
  .where('user_task_history.user_id', userId)
}
