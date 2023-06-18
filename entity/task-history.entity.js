const _ = require("lodash");

class TaskHistoryEntity {
  extractSkillAndBusinessSkill(rawTaskList) {
    let uniqueTask = _.uniqBy(rawTaskList, task => task.id);
    let taskGrouped = this.groupTaskUniqued(rawTaskList, uniqueTask);
    return this.extractGroupSkill(taskGrouped);
  }

  extractGroupSkill(taskGrouped) {
    return taskGrouped.map(task => {
      let { id, name, full_name, start_date, end_date, comment } = task[0];
      let newTask = { id, name, full_name, start_date, end_date, comment };
      newTask.skills = this.extractSkill(task).filter(item => !item.delete_flag);
      newTask.business_skills = this.extractBusinessSkill(task).filter(item => !item.delete_flag);
      return newTask;
    });
  }

  extractSkill(rawSkillList) {
    let rawSkillListNotNull = rawSkillList.filter(item => item.skill_id);
    let listSkillInTask = rawSkillListNotNull.map(item => ({
      id: item.skill_id,
      name: item.skill_name
    }));
    let listUniqSkill = _.uniqBy(listSkillInTask, item => item.id);
    return listUniqSkill.filter(item => item.id);
  }

  extractBusinessSkill(rawBusinessSkillList) {
    let rawBusinessSkillListNotNull = rawBusinessSkillList.filter(item => item.business_skill_id);
    let listBusinessSkillInTask = rawBusinessSkillListNotNull.map(item => ({
      id: item.business_skill_id,
      name: item.business_skill_name
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

exports = module.exports = TaskHistoryEntity;
