const Formatter = require("response-format");
const Repository = require("../../repository/postgres-repository/business-task.repository");
const BusinessUserPeriodRepository = require("../../repository/postgres-repository/business-user-period.repository");
const TaskStatusRepository = require("../../repository/postgres-repository/task-status.repository");
const TaskHistoryRepository = require("../../repository/postgres-repository/user-task-history.repository");
const BusinessTaskEntity = require("../../entity/business-task.entity");
const TaskHistoryEntity = require("../../entity/task-history.entity");
const APIErrorWithKnex = require("../../utils/APIException/APIErrorWithKnex");
const SkillSetEntity = require("../../entity/skill-set.entity");
const username = process.env.JIRA_USERNAME;
const apiToken = process.env.API_TOKEN;
const axios = require("axios");
const fs = require("fs");
const https = require('https');
var shell = require("shelljs");
const { message } = require("response-format");
var dir = process.env.FILE_DIRECTORY;
const cloudinaryUtils = require("../../utils/cloudinary");

module.exports.getAllTask = async (req, res, next) => {
  try {
    let tasks = await Repository.getAllBusinessTask();
    tasks = new BusinessTaskEntity().extractSkillAndBusinessSkill(tasks);
    res.json(Formatter.success(null, tasks));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.getTask = async (req, res, next) => {
  try {
    let task = await Repository.getTask(req.params.id);
    task = new BusinessTaskEntity().extractSkillAndBusinessSkill(task);
    task = task.length ? task[0] : {};
    res.json(Formatter.success(null, task));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.getAllTaskStatus = async (req, res, next) => {
  try {
    let taskStatus = await TaskStatusRepository.getAllTaskStatus();
    res.json(Formatter.success(null, taskStatus));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.archiveTask = async (req, res, next) => {
  let { id } = req.params;
  try {
    let response = await Repository.updateTaskDeleteFlag(id, true);
    res.json(Formatter.success("archive_task_success", response));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.restoreTask = async (req, res, next) => {
  let { id } = req.params;
  try {
    let response = await Repository.updateTaskDeleteFlag(id, false);
    res.json(Formatter.success("restore_task_success", response));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.createTask = async (req, res, next) => {
  try {
    let newTask = await Repository.transactionUpsertTask(req.body);
    res.json(Formatter.success("create_new_task_successfully", newTask));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.updateTask = async (req, res, next) => {
  let { id } = req.params;
  try {
    let newTask = await Repository.transactionUpsertTask({ id, ...req.body });
    res.json(Formatter.success("updated_successfully", newTask));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.getLatestAssessmentApproved = async (req, res, next) => {
  try {
    const latestAssessmentApproved = await BusinessUserPeriodRepository.getAssessmentApprovedOfAllUser();
    const assessmentExtracted = new SkillSetEntity().extractListAssessmentByUser(latestAssessmentApproved);
    res.json(Formatter.success(null, assessmentExtracted));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.getAllMemberTaskHistory = async (req, res, next) => {
  try {
    let items = await TaskHistoryRepository.getAllMemberTaskHistory();
    items = new TaskHistoryEntity().extractSkillAndBusinessSkill(items);
    items = items.length ? items : [];
    res.json(Formatter.success(null, items));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.getAllHistoryByTaskId = async (req, res, next) => {
  try {
    let items = await TaskHistoryRepository.getAllHistoryByTaskId(req.query.id);
    res.json(Formatter.success(null, items));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.addOrCreateTaskHistory = async (req, res, next) => {
  try {
    let item = await TaskHistoryRepository.addOrCreateTaskHistory(req.body);
    res.json(Formatter.success(req.body.id ? "update_member_successfully" : "add_member_successfully", item));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.removeTaskHistory = async (req, res, next) => {
  try {
    let item = await TaskHistoryRepository.removeTaskHistory(req.query.historyId);
    res.json(Formatter.success("remove_member_successfully", item));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.uploadAttackFile = async (req, res) => {
  // if (!fs.existsSync(dir)) shell.mkdir("-p", dir);
  try {
    const result = await cloudinaryUtils.uploadSingle(req.file)
    console.log('result', result)
    res.json(Formatter.success("upload_success", result));
  } catch(err) {
    console.log('err', err)
    res.json(Formatter.badRequest());
  }
};

module.exports.deleteAttackFile = async (req, res) => {
  try {
    fs.unlinkSync(`${dir}/${req.params.path}`);
    res.json(Formatter.success());
  } catch (err) {
    res.json(Formatter.badRequest());
  }
};

module.exports.downAttackFile = async (req, res) => {
  const path = req.query.path;
  if (path) {
    https.get(path, (file) => {
      file.pipe(res)
    })
  }
  else res.json(Formatter.badRequest());
};

module.exports.syncTaskWithJiraProject = async (req, res, next) => {
  const { id, key, jira_url } = req.body;

  try {
    var options = {
      method: "GET",
      url: `${jira_url}/rest/api/3/project`,
      auth: { username: username, password: apiToken },
      headers: {
        Accept: "application/json"
      }
    };
    let response = await axios(options);
    let foundProject = response.data.filter(item => !item.isPrivate).find(p => p.key == key);

    if (foundProject) {
      await Repository.syncTask(id, foundProject.id, key, jira_url);
      res.json(Formatter.success("Linked!", foundProject.id));
    } else {
      await Repository.syncTask(id, null, key, jira_url);
      res.json(Formatter.badRequest("No project found. Unlinked!"));
    }
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};


module.exports.getAllUserTaskHistoryByUserId = async (req, res, next) => {
  try {
    let item = await TaskHistoryRepository.getAllTaskHistoryByUserId(req.user.id);
    res.json(Formatter.success("get_list_task_success", item));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};
