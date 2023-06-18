const config = require("../knexfile.js");
const pgp = require("pg-promise")(/* options */);
const db = pgp(config.connection);

module.exports = {
  db: db
};
