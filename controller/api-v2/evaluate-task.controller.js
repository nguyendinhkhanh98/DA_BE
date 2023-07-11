const Formatter = require("response-format");
const Repository = require("../../repository/postgres-repository/evaluate-task.repository");
const APIErrorWithKnex = require("../../utils/APIException/APIErrorWithKnex");
const _ = require("lodash");

module.exports.getAllEvaluateTask = async (req, res, next) => {
  try {
    let userTaskHistory = await Repository.getAllEvaluateTask(req?.query);

    userTaskHistory = _.groupBy(userTaskHistory, "user_id");
    console.log('userTaskHistory', userTaskHistory)
    userTaskHistory = Object.values(userTaskHistory)
    res.json(Formatter.success(null, userTaskHistory));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};