const CONST = require("../../constants/index");
const { sendEmail } = require("../../service/email/index");
const moment = require("moment");
const fs = require("fs");
const path = require("path");
const hbs = require("handlebars");

const getOffWorkInDuration = (list, start, end) => {
  let cloneList = list.map(item => {
    let updated = moment(item.date_created, CONST.DATE_FORMAT).unix();
    let momentStartDate = moment(start, CONST.DATE_FORMAT).unix();
    let momentEndDate = moment(end, CONST.DATE_FORMAT).unix();
    let isBetween = updated >= momentStartDate && updated <= momentEndDate;
    if (isBetween) return item;
  });
  return cloneList.filter(item => item);
};

const sendEmailOffworkToManager = (user, manager, record) => {
  const title = "[JIRA QCD] Request offwork";

  hbs.registerHelper("getTypeOffwork", function (typeOffwork) {
    const listTypeOffwork = [
      { type: "off_work", label: "Xin nghỉ làm" },
      { type: "go_to_office_late", label: "Xin đến muộn" },
      { type: "leave_office_early", label: "Xin về sớm" },
      { type: "forgot_to_scan_finger", label: "Quên lấy vân tay" },
      { type: "working_outside_office", label: "Làm việc ngoài công ty" }
    ];

    let item = listTypeOffwork.find(item => item.type == typeOffwork);
    return item.label;
  });

  hbs.registerHelper(
    "isOffworkOrWorkingOutside",
    typeOffwork => typeOffwork == "off_work" || typeOffwork == "working_outside_office"
  );
  hbs.registerHelper("isGotoOfficeLate", typeOffwork => typeOffwork == "go_to_office_late");
  hbs.registerHelper("isLeaveOfficeEarly", typeOffwork => typeOffwork == "leave_office_early");

  hbs.registerHelper("getSessionInDay", function (session_in_day) {
    let sessionInDay = [
      { type: "morning", label: "Buổi sáng" },
      { type: "afternoon", label: "Buổi chiều" },
      { type: "all_day", label: "Cả ngày" }
    ];
    let itemSession = sessionInDay.find(item => item.type == session_in_day);
    return itemSession.label;
  });

  const compile = data => {
    const html = fs.readFileSync(path.join(__dirname, "./offwork-template.hbs"));
    return hbs.compile(html.toString())(data);
  };

  let payloadCompiler = {
    title,
    manager_name: manager.fullName,
    user_name: user.fullName,
    qcd_hr_link: `${process.env.CLIENT_URL}/hr-management/analysis`,
    date: moment(record.date_created).format(CONST.DATE_FORMAT),
    reason: record.reason,
    type: record.type,
    data: record.data
  };
  let htmlContent = compile(payloadCompiler);

  const emailData = {
    from: "jira.qcd@gmail.com",
    to: manager.email,
    subject: title,
    html: htmlContent
  };

  sendEmail(emailData);
};

module.exports = {
  getOffWorkInDuration,
  sendEmailOffworkToManager
};
