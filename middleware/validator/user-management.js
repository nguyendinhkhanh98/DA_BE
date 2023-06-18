const { check } = require("express-validator");

exports.createUserValidator = () => {
  return [
    check("username", "Username is required").not().isEmpty(),
    check("email", "Email is required").not().isEmpty(),
    check("email", "Invalid email").isEmail(),
    check("role", "Role is required").not().isEmpty()
  ];
};
