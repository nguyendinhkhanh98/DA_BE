const { check } = require("express-validator");

exports.editProfileValidator = () => {
  return [
    check("email", "Email is required").not().isEmpty(),
    check("email", "Invalid email").isEmail()
  ];
};
