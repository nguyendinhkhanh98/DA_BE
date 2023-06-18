exports.seed = function (knex) {
  return knex.transaction(async trx => {
    try {
      await trx("status").insert([
        { id: 1, name: "InStock" },
        { id: 2, name: "Using" },
        { id: 3, name: "Wait for confirm" },
        { id: 4, name: "In use" },
        { id: 5, name: "__create__" },
        { id: 6, name: "__delete__" }
      ]);
    } catch (error) {
      console.log("status table: Data exist!");
    }
  });
};
