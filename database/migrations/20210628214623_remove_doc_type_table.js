exports.up = async knex => {
  await knex.schema.alterTable("doc_main", t => {
    t.dropForeign("type_id");
    t.dropColumn("type_id");
  });
};

exports.down = function (knex) {};
