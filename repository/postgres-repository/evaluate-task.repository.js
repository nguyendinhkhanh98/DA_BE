const knex = require("../../config/database.js");

module.exports.getAllEvaluateTask = (query) => {
  const { since, until } = query
  return knex("user_task_history")
    .column("start_date", "end_date", "status", "updated_at", "score", { 
      fullName: "user_profile.full_name", projectName: "task.name", projectId: "task.id", roleName: "role_project.name", user_id: "user_profile.id" }
    )
    .select()
    .innerJoin('user_profile', 'user_task_history.user_id', 'user_profile.id')
    .innerJoin('user_project', function() {
      this.on('user_task_history.task_id', 'user_project.project_id')
      .andOn('user_task_history.user_id', 'user_project.user_id')
    })
    .innerJoin('role_project', 'role_project.id', 'user_project.role_project_id')
    .innerJoin('task', 'task.id', 'user_task_history.task_id')
    .where('user_task_history.created_at', '>=', since)
    .where('user_task_history.created_at', '<', until)
};
