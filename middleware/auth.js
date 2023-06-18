const expressJwt = require("express-jwt");
const jwt = require("jsonwebtoken");
const AUTHORITY_CONST = require("./authority-const");

exports.requireLogin = expressJwt({
  secret: process.env.JWT_SECRET
});

exports.isAdmin = (req, res, next) => {
  const { role } = req.user;
  if (role !== AUTHORITY_CONST.ROLE_ADMIN) {
    return res.status(403).json({ message: "You do not have rights to visit this source!" });
  }
  next();
};

exports.isManager = (req, res, next) => {
  const { role } = req.user;
  if (role !== AUTHORITY_CONST.ROLE_MANAGER) {
    return res.status(403).json({ message: "You do not have rights to visit this source!" });
  }
  next();
};
