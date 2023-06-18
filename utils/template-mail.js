const transMail = {
  subject: "Đăng kí lịch nên công ty",
  template: (name, content, nameLeader, month, link) => {
    return `
      <h2>Chào ${nameLeader},</h2>
      <h3>Intern ${name} ${content} lịch nên công ty tháng ${month}.</h3>
      <h3>Nhấn vào đây để xem chi tiết.</h3>
      <h3><a href=${link} target="blank">${link}</a></h3>
      `
  },
  send_failed: "Failed in process send active mail"
}
module.exports = transMail