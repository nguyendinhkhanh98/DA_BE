const _ = require("lodash");

class BusinessTaskEntity {
  extractSkillAndBusinessSkill(rawTaskList) {
    let uniqueTask = _.uniqBy(rawTaskList, task => task.id);
    let taskGrouped = this.groupTaskUniqued(rawTaskList, uniqueTask);
    return this.extractGroupSkill(taskGrouped);
  }

  extractGroupSkill(taskGrouped) {
    return taskGrouped.map(task => {
      let { id, name, key, jira_url, jira_id, description, started_at } = task[0];
      let newTask = { id, name, key, jira_url, jira_id, description, started_at };
      newTask.delete_flag = task[0].task_delete_flag;
      newTask.status = this.extractTaskStatus(task[0]);
      newTask.skills = this.extractSkill(task).filter(item => !item.delete_flag);
      newTask.business_skills = this.extractBusinessSkill(task).filter(item => !item.delete_flag);
      return newTask;
    });
  }

  extractTaskStatus(task) {
    return {
      id: task.status_id,
      name: task.status
    };
  }

  extractSkill(rawSkillList) {
    let rawSkillListNotNull = rawSkillList.filter(item => item.skill_id);
    let listSkillInTask = rawSkillListNotNull.map(item => ({
      id: item.skill_id,
      name: item.skill_name,
      delete_flag: item.skill_delete_flag,
      level: item.skill_level
    }));
    let listUniqSkill = _.uniqBy(listSkillInTask, item => item.id);
    return listUniqSkill.filter(item => item.id);
  }

  extractBusinessSkill(rawBusinessSkillList) {
    let rawBusinessSkillListNotNull = rawBusinessSkillList.filter(item => item.business_skill_id);
    let listBusinessSkillInTask = rawBusinessSkillListNotNull.map(item => ({
      id: item.business_skill_id,
      name: item.business_skill_name,
      delete_flag: item.business_skill_delete_flag,
      level: item.business_skill_level
    }));
    let listUniqBusinessSkill = _.uniqBy(listBusinessSkillInTask, item => item.id);
    return listUniqBusinessSkill.filter(item => item.id);
  }

  groupTaskUniqued(rawTaskList, uniqueTask) {
    return uniqueTask.map(uniq => {
      return rawTaskList.filter(task => task.id == uniq.id);
    });
  }
}

exports = module.exports = BusinessTaskEntity;
