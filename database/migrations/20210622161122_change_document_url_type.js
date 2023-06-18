exports.up = function (knex) {
  return knex.schema.alterTable("doc_main", function (t) {
    t.text("url").alter();
  });
};

exports.down = function (knex) {};
