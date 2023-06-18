exports.up = async knex => {
  await knex.schema.alterTable("doc_main", function (t) {
    t.renameColumn("key", "url");
  });
  await knex.schema.alterTable("doc_url", function (t) {
    t.dropForeign("user_id");
  });
  await knex.schema.alterTable("doc_url_refered_by", function (t) {
    t.dropForeign("doc_url_id");
    t.string("type");
    t.foreign("doc_url_id").references("doc_main.id");
    t.unique(["type", "doc_main_id", "doc_url_id"]);
  });
  await knex.schema.dropTable("doc_url");
};

exports.down = function (knex) {};
