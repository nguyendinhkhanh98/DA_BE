const axios = require("axios");
const logger = require("../../utils/logger.js")(__filename);

exports.pushSlack = async payload => {
  try {
    const { data } = await axios.post(process.env.SLACK_URL, payload);
    return data;
  } catch (error) {
    logger.error(error);
  }
};
