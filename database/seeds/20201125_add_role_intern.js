exports.seed = function (knex) {
  return knex.transaction(async trx => {
    try {
      await trx("role").insert([{ name: "intern" }]);
    } catch (error) {
      console.log("Failed at role table: Role intern exist!");
    }
  });
};
