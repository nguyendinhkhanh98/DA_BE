const Formatter = require("response-format");
const APIErrorWithKnex = require("../../utils/APIException/APIErrorWithKnex");
const FinancialPlanRepository = require("../../repository/postgres-repository/financial-plan.repository");
const ProjectCostRepository = require("../../repository/postgres-repository/project-cost.repository");
const UserProjectRoleRepository = require("../../repository/postgres-repository/user-project-role.repository");
const JiraService = require("../../service/jira/index.js");
const TaskRepository = require("../../repository/postgres-repository/task.repository");
const IssueUtils = require("../../utils/issue.util.js");
const _ = require("lodash");
const moment = require("moment");
const numberOfHoursInAMonth = 8 * 5 * 4;

module.exports.addFinancialPlan = async (req, res, next) => {
  let { name, start_date, end_date, planRoles } = req.body;
  let task_id = req.params.id;
  try {
    let newRecord = await FinancialPlanRepository.addFinancialPlan(task_id, name, start_date, end_date, planRoles);
    res.json(Formatter.success("added_a_financial_plan", newRecord));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.updateFinancialPlan = async (req, res, next) => {
  let { id, name, start_date, end_date, planRoles } = req.body;
  let task_id = req.params.id;
  try {
    let updatedRecord = await FinancialPlanRepository.updateFinancialPlan(
      id,
      task_id,
      name,
      start_date,
      end_date,
      planRoles
    );
    res.json(Formatter.success("updated_a_financial_plan", updatedRecord));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.deleteFinancialPlan = async (req, res, next) => {
  let { id } = req.params;
  try {
    await FinancialPlanRepository.deleteFinancialPlan(id);
    res.json(Formatter.success("possibly_deleted_a_financial_plan"));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.getFinancialPlans = async (req, res, next) => {
  let id = req.params.id;
  let shouldCalculateCost = req.query.cost;
  try {
    let response = await FinancialPlanRepository.getFinancialPlans(shouldCalculateCost ? "-1" : id);
    let planRoles = response.rows;
    let plans = _.groupBy(planRoles, "id");
    let plansWithRoles = [];
    for (var planId in plans) {
      if (Object.prototype.hasOwnProperty.call(plans, planId)) {
        plansWithRoles.push({
          id: planId,
          project: plans[planId][0].project,
          projectId: plans[planId][0].project_id,
          name: plans[planId][0].plan_name,
          plannedCost: plans[planId][0].planned_cost,
          plannedRevenue: plans[planId][0].planned_revenue,
          actualCost: plans[planId][0].actual_cost,
          actualRevenue: plans[planId][0].actual_revenue,
          start_date: moment(plans[planId][0].start_date).format("YYYY-MM-DD"),
          end_date: moment(plans[planId][0].end_date).format("YYYY-MM-DD"),
          last_updated: moment(plans[planId][0].last_updated).format("YYYY-MM-DD"),
          roles: plans[planId]
            .filter(r => r.role_id)
            .map(r => ({ name: r.role_name, quantity: r.quantity, roleId: r.role_id }))
        });
      }
    }

    if (id.includes("p") && plansWithRoles.length) plansWithRoles = plansWithRoles[0];
    if (shouldCalculateCost) {
      let plansWithCost = [];
      let projectIds = [...new Set(plansWithRoles.map(p => p.projectId))];
      let validationResults = await validateProjects(projectIds);
      if (!validationResults.isValid) {
        res.json(
          Formatter.badRequest(
            `Please link ${validationResults.unlinked} to a real Jira project in the Task management interface!`,
            null
          )
        );
        return;
      }
      for (let i = 0; i < projectIds.length; i++) {
        const projectId = projectIds[i];
        let re = await getPlansWithCost(
          projectId,
          plansWithRoles.filter(p => p.projectId == projectId)
        );
        plansWithCost = plansWithCost.concat(re.plansWithCost);
      }
      plansWithRoles = plansWithCost;
      await updateFinancialPlanCostAndRevenue(plansWithRoles);
    }

    res.json(Formatter.success(null, plansWithRoles));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

let updateFinancialPlanCostAndRevenue = async plansWithRoles => {
  for (let i = 0; i < plansWithRoles.length; i++) {
    let plan = plansWithRoles[i];
    await FinancialPlanRepository.updateFinancialPlanCostAndRevenue(
      plan.id,
      plan.plannedCost,
      plan.plannedRevenue,
      plan.actualCost,
      plan.actualRevenue
    );
  }
};

let validateProjects = async projectIds => {
  for (let i = 0; i < projectIds.length; i++) {
    const projectId = projectIds[i];
    let task = await TaskRepository.getTaskById(projectId);
    task = task[0];
    if (!task.jira_id) return { isValid: false, unlinked: task.name };
  }
  return { isValid: true };
};

let getPlansWithCost = async (id, plansWithRoles) => {
  let task = await TaskRepository.getTaskById(id);
  task = task[0];
  let definedRoleCosts = await ProjectCostRepository.getProjectCostByProjectId(id);
  let plannedRoles = [];
  plansWithRoles.forEach(p => {
    p.roles.forEach(r => {
      if (plannedRoles.findIndex(r2 => r2.roleId == r.roleId) == -1)
        plannedRoles.push({ roleId: r.roleId, name: r.name });
    });
  });

  let jiraUrl = task.jira_url;
  let filters = { project: [task.key], issuetype: [], status: [], sprint: [], assignee: [] };
  let projectMembers = await ProjectCostRepository.getListUserRoleProjectByProjectId(id);
  let response = await UserProjectRoleRepository.getUserProjectRoles(id);
  let projectRoles = response.rows;
  projectRoles = projectRoles.map(r => ({
    ...r,
    jiraEmail: projectMembers.find(m => m.user_id == r.user_id)?.jira_email,
    cost: getRoleCost(r.role_id, definedRoleCosts)?.cost ?? 0,
    unit_cost: getRoleCost(r.role_id, definedRoleCosts)?.unit_cost ?? 0,
    other_cost: getRoleCost(r.role_id, definedRoleCosts)?.other_cost ?? 0
  }));

  for (let i = 0; i < plansWithRoles.length; i++) {
    let p = plansWithRoles[i];

    let monthDiff = moment(p.end_date).add(1, "days").diff(moment(p.start_date), "months", true);
    p.plannedCost = p.roles.reduce((p, c) => costFunc(p, c, getRoleCost(c.roleId, definedRoleCosts), monthDiff), 0);
    p.plannedRevenue = p.roles.reduce((p, c) => revFunc(p, c, getRoleCost(c.roleId, definedRoleCosts), monthDiff), 0);

    let duration = [moment(p.start_date).format("YYYY/MM/DD"), moment(p.end_date).format("YYYY/MM/DD")];
    let issues = await getIssuesWithinPlanDuration(jiraUrl, filters, duration);
    calculateWorklogForEachRole(issues, projectRoles, p.id);

    p.actualCost = projectRoles.reduce((pre, cur) => actualCostFunc(pre, cur, p.id), 0);
    p.actualRevenue = projectRoles.reduce((pre, cur) => actualRevFunc(pre, cur, p.id), 0);
  }

  return { isValid: true, plansWithCost: plansWithRoles };
};

let getRoleCost = (roleId, definedRoleCosts) => definedRoleCosts.find(r => r.role_id == roleId);

let costFunc = (previousValue, plannedRole, definedRoleCost, monthDiff) =>
  previousValue +
  ((definedRoleCost?.unit_cost ?? 0) + (definedRoleCost?.other_cost ?? 0)) * plannedRole.quantity * monthDiff;

let revFunc = (previousValue, plannedRole, definedRoleCost, monthDiff) =>
  previousValue + (definedRoleCost?.cost ?? 0) * plannedRole.quantity * monthDiff;

let actualCostFunc = (previousValue, role, planId) =>
  previousValue +
  ((role[`totalTimeSpentSeconds_${planId}`] ?? 0) / 3600 / numberOfHoursInAMonth) * (role.unit_cost + role.other_cost);

let actualRevFunc = (previousValue, role, planId) =>
  previousValue + ((role[`totalTimeSpentSeconds_${planId}`] ?? 0) / 3600 / numberOfHoursInAMonth) * role.cost;

let getIssuesWithinPlanDuration = async (jiraUrl, filters, duration) => {
  let issues = await JiraService.getAllIssuesWithAllWorklog(jiraUrl, filters, duration);
  issues = issues.map(issue => {
    issue.fields.worklog.worklogs = IssueUtils.getWorklogInDuration(issue.fields.worklog.worklogs, duration);
    issue.fields.worklog.total = issue.fields.worklog.worklogs.length;
    return issue;
  });
  return issues;
};

let calculateWorklogForEachRole = (issues, projectRoles, planId) => {
  for (let j = 0; j < issues.length; j++) {
    let worklogs = issues[j].fields.worklog.worklogs;
    for (let k = 0; k < worklogs.length; k++) {
      let worklog = worklogs[k];
      let matchedEmailRoles = projectRoles.filter(r => r.jiraEmail == worklog.author.emailAddress);
      let matchedRole = matchedEmailRoles.find(r =>
        moment(worklog.started).isBetween(r.start_date, r.end_date ?? 1e15, "day", "[]")
      );
      if (matchedRole && !matchedRole[`totalTimeSpentSeconds_${planId}`])
        matchedRole[`totalTimeSpentSeconds_${planId}`] = 0;
      if (matchedRole) matchedRole[`totalTimeSpentSeconds_${planId}`] += worklog.timeSpentSeconds;
    }
  }
};
