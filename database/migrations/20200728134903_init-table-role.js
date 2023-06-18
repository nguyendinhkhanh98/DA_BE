exports.up = function (knex) {
  return knex("role")
    .select("*")
    .whereIn("name", ["admin", "manager", "leader", "developer", "tester", "guest"])
    .then(res => {
      const exist = res && res.length;

      if (!exist) {
        return knex("role").insert([
          { name: "admin" },
          { name: "manager" },
          { name: "leader" },
          { name: "developer" },
          { name: "tester" },
          { name: "guest" }
        ]);
      }
    });
};

exports.down = function (knex) {
  return Promise.resolve();
};
