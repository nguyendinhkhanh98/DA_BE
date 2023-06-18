exports.seed = function (knex) {
  return knex.transaction(async trx => {
    try {
      await trx("project").insert([
        { name: "LPIC" },
        { name: "SARS" },
        { name: "DRONE" },
        { name: "OCR" },
        { name: "UNITY" }
      ]);
    } catch (error) {
      console.log("Seed to project table: Data exist!");
    }
  });
};
