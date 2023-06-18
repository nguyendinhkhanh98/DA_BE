const { check } = require("express-validator");

exports.changePasswordValidator = () => {
  return [
    check("newPassword").isLength({ min: 5 })
      .withMessage("Password must be at least 5 chars long")
      .matches(/\d/).withMessage("Password must contain a number")
  ];
};
