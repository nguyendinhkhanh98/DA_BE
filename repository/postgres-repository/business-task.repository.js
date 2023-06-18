const knex = require("../../config/database.js");
const ProjectCostRepository = require("../../repository/postgres-repository/project-cost.repository");

module.exports.getAllBusinessTask = () => {
  return bodyQueryTask();
};

module.exports.getTask = id => {
  return bodyQueryTask().where("task.id", id);
};

module.exports.updateTaskDeleteFlag = (id, delete_flag) => {
  return knex("task")
    .update({
      delete_flag
    })
    .where({ id });
};

module.exports.transactionUpsertTask = ({
  id,
  name,
  key,
  jira_url,
  description,
  status_id,
  started_at,
  skills,
  business_skill
}) => {
  return new Promise((resolve, reject) => {
    return knex.transaction(async trx => {
      try {
        let newTask = await upsertTask(trx, id, name, key, jira_url, description, status_id, started_at);
        await upsertTaskSkill(trx, newTask[0].id, skills);
        await upsertTaskBusinessSkill(trx, newTask[0].id, business_skill);
        if (id == "add") {
          let defaultRolesWithPrice = await knex("role_project")
            .select("id", "monthly_salary", "unit_cost", "other_cost")
            .where("monthly_salary", ">", 0)
            .orWhere("unit_cost", ">", 0)
            .orWhere("other_cost", ">", 0);
          let taskID = newTask[0].id;
          let allRequests = [];
          for (let i = 0; i < defaultRolesWithPrice.length; i++) {
            allRequests.push(
              ProjectCostRepository.upsertProjectCost(
                "add",
                defaultRolesWithPrice[i].id,
                taskID,
                defaultRolesWithPrice[i].monthly_salary,
                defaultRolesWithPrice[i].unit_cost,
                defaultRolesWithPrice[i].other_cost
              )
            );
          }
          await Promise.all(allRequests);
        }

        resolve(newTask);
      } catch (error) {
        reject(error);
      }
    });
  });
};

const upsertTask = (trx, id, name, key, jira_url, description, status_id, started_at) => {
  description = description ? description : null;
  let isCreate = ["add", null, undefined].includes(id);

  if (!isCreate)
    return trx("task").update({ name, key, jira_url, description, status_id, started_at }).where({ id }).returning("*");
  return trx("task").insert({ name, key, jira_url, description, status_id, started_at }).returning("*");
};

const upsertTaskSkill = async (trx, task_id, skills) => {
  await trx("task_skill").delete().where({ task_id });
  const safeSkills = skills.filter(item => {
    let isCorrectSkillId = !isNaN(parseInt(item.skill_id));
    let isCorrectLevel = !isNaN(parseInt(item.level_required));
    return isCorrectSkillId && isCorrectLevel;
  });
  const listPayload = safeSkills.map(item => ({
    task_id,
    skill_id: item.skill_id,
    level_required: item.level_required
  }));
  await trx("task_skill").insert(listPayload);
};

const upsertTaskBusinessSkill = async (trx, task_id, skills) => {
  await trx("task_business_skill").delete().where({ task_id });
  const safeSkills = skills.filter(item => {
    const isCorrectSkillId = !isNaN(parseInt(item.business_skill_id));
    const isCorrectLevel = !isNaN(parseInt(item.level_required));
    return isCorrectSkillId && isCorrectLevel;
  });
  const listPayload = safeSkills.map(item => ({
    task_id,
    business_skill_id: item.business_skill_id,
    level_required: item.level_required
  }));
  await trx("task_business_skill").insert(listPayload);
};

const bodyQueryTask = () => {
  return knex("task")
    .select(
      "task.id",
      "task.name",
      "task.key",
      "task.jira_url",
      "task.jira_id",
      "task.description",
      "task.started_at",
      "task.status_id",
      {
        task_delete_flag: "task.delete_flag",
        status: "task_status.name",
        skill_id: "skill.id",
        skill_name: "skill.name",
        skill_delete_flag: "skill.delete_flag",
        skill_level: "task_skill.level_required",

        business_skill_id: "business_skill.id",
        business_skill_name: "business_skill.name",
        business_skill_delete_flag: "business_skill.delete_flag",
        business_skill_level: "task_business_skill.level_required"
      }
    )
    .leftJoin("task_status", "task_status.id", "task.status_id")

    .leftJoin("task_skill", "task_skill.task_id", "task.id")
    .leftJoin("skill", "skill.id", "task_skill.skill_id")

    .leftJoin("task_business_skill", "task_business_skill.task_id", "task.id")
    .leftJoin("business_skill", "business_skill.id", "task_business_skill.business_skill_id");
};

module.exports.syncTask = (id, jira_id, key, jira_url) => {
  return knex("task").update({ jira_id, key, jira_url }).where({ id }).returning("*");
};
