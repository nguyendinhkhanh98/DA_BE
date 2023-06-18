exports.seed = function (knex) {
  return knex.transaction(async trx => {
    try {
      await trx("jira_project").insert([
        { name: "LPIC", url: "https://arrowtech.atlassian.net" },
        { name: "SARS", url: "https://arrowtech02.atlassian.net" },
        { name: "UNITY", url: "https://arrowtech03.atlassian.net" },
        { name: "DRONE, DOC OCR", url: "https://arrowtech04.atlassian.net" }
      ]);
    } catch (error) {
      console.log("jira-project table: Project exist!");
    }
  });
};
