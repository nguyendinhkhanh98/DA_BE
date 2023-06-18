const knex = require("../../config/database.js");

module.exports.getLastPeriodApproved = async () => {
  const res = await knex("user_period")
    .column("period_id", "created_at")
    .select()
    .where({ status: "Approved" })
    .groupBy("period_id", "created_at")
    .orderBy("created_at", "desc");
  return res.length ? res[0].period_id : null;
};
