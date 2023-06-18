exports.up = function (knex) {
  const invoice_status = knex.schema.createTable("invoice_status", function (t) {
    t.increments("id").primary();
    t.string("name").unique().notNull();
    t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();
  });

  const invoice_project = knex.schema.createTable("invoice_project", function (t) {
    t.increments("id").primary();
    t.string("name").unique().notNull();
    t.integer("project_id");
    t.integer("user_created");
    t.float("cost");
    t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();

    t.foreign("project_id").references("project.id");
    t.foreign("user_created").references("user.id");
  });

  const invoice_history = knex.schema.createTable("invoice_history", function (t) {
    t.increments("id").primary();
    t.integer("invoice_id");
    t.integer("status_id");

    t.string("start_date");
    t.string("end_date");
    t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();

    t.foreign("invoice_id").references("invoice_project.id");
    t.foreign("status_id").references("invoice_status.id");
  });

  const init_invoice_status = knex("invoice_status").insert([
    { name: "PLAN" },
    { name: "INVOICE issued" },
    { name: "Acceptance" },
    { name: "Money Transfer" },
    { name: "Payment Confirmed" }
  ]);

  return Promise.all([invoice_status, invoice_project, invoice_history, init_invoice_status]);
};

exports.down = function (knex) {
  const invoice_status = knex.schema.dropTable("invoice_status");
  const invoice_history = knex.schema.dropTable("invoice_history");
  const invoice_project = knex.schema.dropTable("invoice_project");

  return Promise.all([invoice_history, invoice_status, invoice_project]);
};
