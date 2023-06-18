exports.up = function (knex) {
  const createTableUser = knex.schema.hasTable("user").then(function (exists) {
    if (!exists) {
      return knex.schema.createTable("user", function (t) {
        t.increments("id").primary();
        t.string("username").unique().notNull();
        t.string("hash_password").notNull();
        t.string("email").unique().notNull();
        t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();
      });
    }
  });

  const createTableUserProfile = knex.schema.hasTable("user_profile").then(function (exists) {
    if (!exists) {
      return knex.schema.createTable("user_profile", function (t) {
        t.integer("id");
        t.string("full_name");
        t.string("address");
        t.string("phone");
        t.date("birthday");
        t.string("avatar");

        t.foreign("id").references("user.id");
        t.primary("id");
        t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();
      });
    }
  });

  const createTableRole = knex.schema.hasTable("role").then(function (exists) {
    if (!exists) {
      return knex.schema.createTable("role", function (t) {
        t.increments("id").primary();
        t.string("name").unique().notNull();
        t.boolean("delete_flg").notNull().defaultTo(false);

        t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();
      });
    }
  });

  const createTableUserRole = knex.schema.hasTable("user_role").then(function (exists) {
    if (!exists) {
      return knex.schema.createTable("user_role", function (t) {
        t.integer("user_id").notNull();
        t.integer("role_id").notNull();
        t.string("status");

        t.foreign("user_id").references("user.id");
        t.foreign("role_id").references("role.id");
        t.primary(["user_id", "role_id"]);
        t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();
      });
    }
  });

  const createTableUserPerformance = knex.schema.hasTable("user_performance").then(function (exists) {
    if (!exists) {
      return knex.schema.createTable("user_performance", function (t) {
        t.increments("id").primary();
        t.integer("user_id").notNull();
        t.date("work_date");
        t.string("sprint");
        t.specificType("cpi", "numeric");

        t.foreign("user_id").references("user.id");
        t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();
      });
    }
  });

  return Promise.all([
    createTableUser,
    createTableUserProfile,
    createTableRole,
    createTableUserRole,
    createTableUserPerformance
  ]);
};

exports.down = function (knex) {
  const user_performance = knex.schema.dropTable("user_performance");
  const user_role = knex.schema.dropTable("user_role");
  const role = knex.schema.dropTable("role");
  const user_profile = knex.schema.dropTable("user_profile");
  const user = knex.schema.dropTable("user");

  return Promise.all([user_performance, user_role, role, user_profile, user]);
};
