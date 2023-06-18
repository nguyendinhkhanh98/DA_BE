const knex = require("../../config/database.js");

module.exports.getUserPerformanceBySprint = sprint => {
  return knex("user_performance")
    .column(
      "user_performance.id",
      { userId: "user_id" },
      { fullName: "full_name" },
      "email",
      { workDate: "work_date" },
      "sprint",
      "cpi"
    )
    .leftJoin("user", "user.id", "user_performance.user_id")
    .leftJoin("user_profile", "user.id", "user_profile.id")
    .where({ sprint: sprint });
};
