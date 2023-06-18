exports.up = knex => {
  const doc_type = knex.schema.createTable("doc_type", t => {
    t.increments("id").primary();
    t.string("name").unique();
    t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();
  });

  const doc_spec_type = knex.schema.createTable("doc_spec_type", t => {
    t.increments("id").primary();
    t.string("name").unique();
    t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();
  });

  const init_spec_type = knex("doc_spec_type").insert([
    { id: 1, name: "Outline Specification" },
    { id: 2, name: "Requirements Specification" },
    { id: 3, name: "Programing Specification" }
  ]);

  const doc_main = knex.schema.createTable("doc_main", t => {
    t.increments("id").primary();
    t.string("doc_number").notNull();
    t.string("title").notNull();
    t.string("description").notNull();
    t.string("key").notNull();
    t.integer("user_id").notNull();
    t.integer("project_id").notNull();
    t.integer("type_id").notNull();
    t.integer("spec_id").notNull();
    t.boolean("delete_flag").notNull().defaultTo(false);
    t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();

    t.foreign("type_id").references("doc_type.id");
    t.foreign("spec_id").references("doc_spec_type.id");
    t.foreign("user_id").references("user_profile.id");
    t.foreign("project_id").references("task.id");
  });

  const doc_tag = knex.schema.createTable("doc_tag", t => {
    t.increments("id").primary();
    t.string("name").unique();
    t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();
  });

  const doc_tag_refered_by = knex.schema.createTable("doc_tag_refered_by", t => {
    t.increments("id").primary();
    t.integer("doc_tag_id").notNull();
    t.integer("doc_main_id").notNull();

    t.foreign("doc_tag_id").references("doc_tag.id");
    t.foreign("doc_main_id").references("doc_main.id");
  });

  const doc_url = knex.schema.createTable("doc_url", t => {
    t.increments("id").primary();
    t.string("url").notNull();
    t.string("title").notNull();
    t.string("type").notNull();
    t.string("doc_number").notNull();
    t.integer("user_id").notNull();
    t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();

    t.foreign("user_id").references("user_profile.id");
  });

  const doc_url_refered_by = knex.schema.createTable("doc_url_refered_by", t => {
    t.increments("id").primary();
    t.integer("doc_url_id").notNull();
    t.integer("doc_main_id").notNull();

    t.foreign("doc_main_id").references("doc_main.id");
    t.foreign("doc_url_id").references("doc_url.id");
  });

  return Promise.all([
    doc_tag,
    doc_url,
    doc_main,
    doc_tag_refered_by,
    doc_type,
    doc_url_refered_by,
    doc_spec_type,
    init_spec_type
  ]);
};

exports.down = knex => {
  const doc_tag = knex.schema.dropTable("doc_tag");
  const doc_url = knex.schema.dropTable("doc_url");
  const doc_main = knex.schema.dropTable("doc_main");
  const doc_tag_refered_by = knex.schema.dropTable("doc_tag_refered_by");
  const doc_type = knex.schema.dropTable("doc_type");
  const doc_spec_type = knex.schema.dropTable("doc_spec_type");
  const doc_url_refered_by = knex.schema.dropTable("doc_url_refered_by");
  return Promise.all([doc_tag, doc_url, doc_main, doc_tag_refered_by, doc_type, doc_url_refered_by, doc_spec_type]);
};
