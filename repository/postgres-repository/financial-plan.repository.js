const knex = require("../../config/database.js");

module.exports.addFinancialPlan = async (task_id, name, start_date, end_date, planRoles) => {
  let plans = await knex("financial_plan").insert({ task_id, name, start_date, end_date }).returning("*");
  let plan = plans[0];
  let insertedPlanRoles;
  if (planRoles?.length) {
    planRoles.forEach(role => {
      role.plan_id = plan.id;
    });
    insertedPlanRoles = await knex("financial_plan_role").insert(planRoles).returning("*");
  }
  return { ...plan, ...insertedPlanRoles };
};

module.exports.getFinancialPlans = id => {
  return knex.raw(`select fp.id, t.name as project, t.id as project_id, fp.name as plan_name, start_date, end_date, planned_cost, planned_revenue, actual_cost, actual_revenue, fp.last_updated, rp.name as role_name, fpr.role_id, quantity from financial_plan fp join task t on t.id = fp.task_id
  left join financial_plan_role fpr on fp.id = fpr.plan_id
  left join role_project rp on fpr.role_id = rp.id
  where ${id.includes("p") ? "fp.id" : "task_id"} = ${id.includes("p") ? id.substring(1) : id} or ${id == -1}`);
};

module.exports.updateFinancialPlan = async (id, task_id, name, start_date, end_date, planRoles) => {
  let plans = await knex("financial_plan")
    .where("id", "=", id)
    .update({ name, task_id, start_date, end_date })
    .returning("*");
  let plan = plans[0];
  let updatedPlanRoles;
  if (planRoles?.length) {
    planRoles.forEach(role => {
      role.plan_id = plan.id;
    });
    await knex("financial_plan_role").where("plan_id", "=", plan.id).del();
    updatedPlanRoles = await knex("financial_plan_role").insert(planRoles).returning("*");
  }
  return { ...plan, ...updatedPlanRoles };
};

module.exports.updateFinancialPlanCostAndRevenue = async (
  id,
  planned_cost,
  planned_revenue,
  actual_cost,
  actual_revenue
) => {
  let plans = await knex("financial_plan")
    .where("id", "=", id)
    .update({ planned_cost, planned_revenue, actual_cost, actual_revenue, last_updated: knex.fn.now() })
    .returning("*");
  let plan = plans[0];

  return { ...plan };
};

module.exports.deleteFinancialPlan = async id => {
  await knex("financial_plan").where("id", "=", id).delete();
  await knex("financial_plan_role").where("plan_id", "=", id).delete();
};
