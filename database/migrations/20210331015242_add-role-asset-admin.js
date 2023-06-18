exports.up = async function (knex) {
  const exist = await knex("role").select("*").where({ name: "asset_admin" });
  if (!exist || !exist.length) {
    await knex("role").insert({ name: "asset_admin" });
  }
};

exports.down = async function (knex) {
  const exist = await knex("role")
    .select("*")
    .leftJoin("user_role", "user_role.role_id", "role.id")
    .where({ "role.name": "asset_admin" });
  if (!exist || !exist.length) {
    return knex("user_role").where({ name: "asset_admin" }).del();
  }
};
