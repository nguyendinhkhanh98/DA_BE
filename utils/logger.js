const log4js = require("log4js");
const path = require("path");

module.exports = function (pathToFile) {
  const filename = path.basename(pathToFile);
  const logger = log4js.getLogger(filename);
  logger.level = process.env.LEVEL_LOG || "debug";
  return logger;
};
