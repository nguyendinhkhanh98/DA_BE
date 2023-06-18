const Handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");
const HtmlDocx = require("html-docx-js-typescript");

const compile = dataPayload => {
  const html = fs.readFileSync(path.join(__dirname, "./report-by-user.template.hbs"));
  return Handlebars.compile(html.toString())(dataPayload);
};

Handlebars.registerHelper("convertLevelToText", function (value) {
  switch (value) {
    case 0:
      return "Novice";
    case 1:
      return "Advanced Novice";
    case 2:
      return "Completent";
    case 3:
      return "Proficient";
    case 4:
      return "Expert";
  }
  return "";
});

const normalizeData = dataSource => {
  if (!dataSource.strongProgramingLanguage) dataSource.strongProgramingLanguage = [];
  if (!dataSource.strongFrameworks) dataSource.strongFrameworks = [];
  if (!dataSource.strongTechnologies) dataSource.strongTechnologies = [];
  return dataSource;
};

module.exports = async function (dataBinding) {
  dataBinding = normalizeData(dataBinding);

  let htmlContent = compile(dataBinding);
  let docxBlob = await HtmlDocx.asBlob(htmlContent);
  return docxBlob;
};
