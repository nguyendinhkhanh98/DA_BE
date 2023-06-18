const Formatter = require("response-format");
const APIError = require("../utils/APIException/APIError");
const APIErrorWithKnex = require("../utils/APIException/APIErrorWithKnex");
const HandleErrorKnex = require("../utils/APIException/handleErrorKnex");

// End of route, catch route if not exist in routes/index.js
const notFoundErrorHandler = (req, res, next) => {
  res.json(Formatter.notFound());
};

// Catch error from express-jwt middleware
const authErrorHandler = (err, req, res, next) => {
  if (err.name === "UnauthorizedError") {
    return res.status(err.status).json(err);
  }

  next(err);
};

const apiErrorWithKnexHandler = (err, req, res, next) => {
  if (!(err instanceof APIErrorWithKnex)) {
    return next(err);
  }
  HandleErrorKnex(res, err.errors);
};

const apiErrorHandler = (err, req, res, next) => {
  err = apiErrorConverter(err);
  res.json(Formatter.create(err.status, true, err.message, err.errors));
};

const apiErrorConverter = err => {
  if (!(err instanceof APIError)) {
    return new APIError({
      message: err.message,
      status: err.status,
      stack: err.stack
    });
  }

  return err;
};

module.exports = [notFoundErrorHandler, authErrorHandler, apiErrorWithKnexHandler, apiErrorHandler];
