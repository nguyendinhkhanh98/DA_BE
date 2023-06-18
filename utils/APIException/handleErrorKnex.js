const Formatter = require("response-format");

module.exports = function (res, error) {
  console.error(error);
  switch (error.code) {
    case "23502":
      res.json(Formatter.badRequest("error_data_invalid", "record_contrain_null_value"));
      break;
    case "23505":
      res.json(Formatter.badRequest("error_data_duplicate", error.detail));
      break;
    case "22P02":
      res.json(Formatter.badRequest("error_data_invalid", error.detail || "error_data_invalid"));
      break;

    default:
      res.json(Formatter.badRequest());
      break;
  }
};
