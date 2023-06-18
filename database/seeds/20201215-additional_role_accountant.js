exports.seed = function (knex) {
  return knex.transaction(async trx => {
    try {
      await trx("role").insert({ name: "accountant" });
    } catch (error) {
      console.log("role table: exist role 'accountant'");
    }
  });
};
