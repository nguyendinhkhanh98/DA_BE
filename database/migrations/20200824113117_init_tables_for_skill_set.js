exports.up = function (knex, PromisePrototype) {
  const levelsData = [
    {
      level: 0,
      type: "skill",
      name: "Level 0 (Novice)",
      description: `Phải mất nhiều thời gian nghiên cứu để hiểu ở mức độ cơ bản. Khi 
        thực hiện công việc, cần hỗ trợ và hướng dẫn.`
    },
    {
      level: 1,
      type: "skill",
      name: "Level 1 (Advanced Novice)",
      description: `Hiểu trình độ cơ bản, có thể thực hiện yêu cầu đơn giản,
        vẫn cần hỗ trợ và hướng dẫn. Có thể phân tích và xử lý từng phần của vấn đề.`
    },
    {
      level: 2,
      type: "skill",
      name: "Level 2 (Completent)",
      description: `Hiểu bản chất của vấn đề hoặc công nghệ liên quan. Hầu hết các
        công việc có thể được thực hiện bởi chính bạn. Các vấn đề có thể được phân tích và xử lý trung bình. Vấn
        đề có thể được nhận ra trong các tình huống chung hơn.`
    },
    {
      level: 3,
      type: "skill",
      name: "Level 3 (Proficient)",
      description: `Hiểu biết sâu sắc về các vấn đề và kỹ thuật liên quan. Có thể xử
        lý các vấn đề khó khăn. Làm công việc thủ công. Hiểu vấn đề một cách toàn diện, và có thể đưa ra đề
        xuất. Bạn có thể dẫn dắt người khác.`
    },
    {
      level: 4,
      type: "skill",
      name: "Level 4 (Except)",
      description: `Hiểu biết sâu sắc về các vấn đề và kỹ thuật liên quan. Có thể xử
        lý các vấn đề phức tạp. Hiểu vấn đề sâu sắc, và có thể đưa ra các đề xuất hoàn hảo để áp dụng. Toàn bộ
        hình ảnh và phương pháp xử lý tối ưu có thể được công nhận. Công nghệ có thể được định hướng hoặc tác
        động đến nhóm.`
    },
    {
      level: 0,
      type: "fl",
      name: "Cấp độ 0 (Không biết)",
      description: `Không biết ngôn ngữ`
    },
    {
      level: 1,
      type: "fl",
      name: "Cấp độ 1 (Đọc hiểu)",
      description: `Trình độ sơ cấp`
    },
    {
      level: 2,
      type: "fl",
      name: "Cấp độ 2 (Chuyên sâu)",
      description: `Trình độ trung cấp`
    },
    {
      level: 3,
      type: "fl",
      name: "Cấp độ 3 (Nâng cao)",
      description: `Trình độ nâng cao`
    },
    {
      level: 4,
      type: "fl",
      name: "Cấp độ 4 (Bản ngữ)",
      description: `Có thể dùng ngôn ngữ như người bản địa`
    }
  ];

  const levels = knex.schema.createTable("levels", function (t) {
    t.increments("id").primary();
    t.integer("level");
    t.string("type");
    t.string("name").unique();
    t.text("description");
    t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();
  });

  const period = knex.schema.createTable("period", function (t) {
    t.increments("id").primary();
    t.string("name").unique().notNull();
    t.date("start_date");
    t.date("end_date");
    t.string("description");
    t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();
  });

  const user_period = knex.schema.createTable("user_period", function (t) {
    t.increments("id").primary();
    t.integer("period_id").notNull();
    t.integer("user_id").notNull();
    t.integer("leader_id").notNull();
    t.string("status");

    t.foreign("period_id").references("period.id");
    t.foreign("user_id").references("user.id");
    t.foreign("leader_id").references("user.id");
    t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();
  });

  const skill_category = knex.raw(`CREATE TABLE IF NOT EXISTS skill_category (
    id serial PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description VARCHAR(255),
    sort serial,
    delete_flag BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
  );`);

  const skill = knex.schema.createTable("skill", function (t) {
    t.increments("id").primary();
    t.integer("category_id");
    t.string("name").unique().notNull();
    t.string("description");
    t.boolean("delete_flag").notNull().defaultTo(false);

    t.foreign("category_id").references("skill_category.id");
    t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();
  });

  const skill_set = knex.schema.createTable("skill_set", function (t) {
    t.increments("id").primary();
    t.integer("user_period_id").notNull();
    t.integer("skill_id").notNull();
    t.integer("experience_time");
    t.integer("level");
    t.integer("level_review");
    t.string("note");

    t.unique(["user_period_id", "skill_id"]);
    t.foreign("user_period_id").references("user_period.id");
    t.foreign("skill_id").references("skill.id");
    t.timestamp("created_at").defaultTo(knex.fn.now()).notNull();
  });

  const initLevelsTable = knex("levels").insert(levelsData);

  return Promise.all([levels, period, user_period, skill, skill_category, skill_set, initLevelsTable]);
};

exports.down = function (knex, PromisePrototype) {
  const levels = knex.schema.dropTable("levels");
  const period = knex.schema.dropTable("period");
  const user_period = knex.schema.dropTable("user_period");
  const skill_category = knex.schema.dropTable("skill_category");
  const skill = knex.schema.dropTable("skill");
  const skill_set = knex.schema.dropTable("skill_set");
  return Promise.all([levels, skill_set, user_period, skill, skill_category, period]);
};
