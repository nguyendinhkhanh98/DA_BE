exports.up = function (knex) {
  return knex("role").insert([
    {
      name: "financial_admin"
    },
    {
      name: "skillset_admin"
    },
    {
      name: "jira_admin"
    }
  ]);
};

exports.down = function (knex) {
  const roles = ["financial_admin", "skillset_admin", "jira_admin"];
  return knex("role").whereIn("name", roles).del();
};
