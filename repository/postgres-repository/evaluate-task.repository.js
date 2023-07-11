const knex = require("../../config/database.js");

module.exports.getAllEvaluateTask = (query) => {
  console.log('query', query)
  const { since, until } = query
  return knex("user_task_history")
    .column("start_date", "end_date", "status", "updated_at", { 
      fullName: "user.username", projectName: "task.name", projectId: "task.id", roleName: "role_project.name", user_id: "user.id" }
    )
    .select()
    .leftJoin('user', 'user_task_history.user_id', 'user.id')
    .leftJoin('user_project', 'user.id', 'user_project.user_id')
    .leftJoin('role_project', 'role_project.id', 'user_project.role_project_id')
    .leftJoin('task', 'task.id', 'user_task_history.task_id')
    // .where('user_task_history.createdAt', '>=', since)
    // .where('user_task_history.createdAt', '<', until)
    // .whereBetween('createdAt', [from, to]);
};
