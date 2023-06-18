const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const expressJwt = require("express-jwt");
const errorHandling = require("./middleware/error");
require("pretty-error").start();
if (!process.env.PORT) require("dotenv-flow").config({ path: "environments/" });

// Middleware
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());
app.use(
  expressJwt({ secret: process.env.JWT_SECRET }).unless({
    path: [
      "/api/login",
      "/api/password/forgot",
      "/api/password/reset",
      "/api/asset-management/asset/bind-confirm",
      "/api/v2/jira-project/projects",
      /^\/api\/v2\/files\/.*/
    ]
  })
);

// Router
app.use(require("./routes"));

// Error handler, send stacktrace only during development
app.use(errorHandling);

// Cron-job
require("./service/cron-job").start();

// Run
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("Server is running at " + PORT);
});
