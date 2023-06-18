const nodemailer = require("nodemailer");
const logger = require("../../utils/logger.js")(__filename);

const createNewUserMail = (receiver, subject, htmlContent) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "lpic.nonreply@gmail.com",
      pass: "ARROW201&"
    }
  });

  const mailOptions = {
    from: "lpic.nonreply@gmail.com",
    to: receiver,
    subject: subject,
    html: htmlContent
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      logger.error(error);
      return false;
    } else {
      return true;
    }
  });
};

const sendEmail = mailOptions => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "lpic.nonreply@gmail.com",
      pass: "ARROW201&"
    }
  });

  // var mailOptions = {
  //   from: "jira.qcd@gmail.com",
  //   to: receiver,
  //   subject: subject,
  //   html: htmlContent
  // };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      logger.error(error);
      return false;
    } else {
      return true;
    }
  });
};

module.exports = {
  createNewUserMail,
  sendEmail
};
