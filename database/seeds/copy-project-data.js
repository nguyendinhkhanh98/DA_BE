exports.seed = async knex => {
  await knex("task_status").del();
  await knex("task_status").insert([
    {
      id: 1,
      name: "Initation"
    },
    {
      id: 2,
      name: "Plan"
    },
    {
      id: 3,
      name: "Executing"
    },
    {
      id: 4,
      name: "Close"
    }
  ]);
  const items = await knex.select().from("project");
  items.forEach(item => (item.status_id = 1));
  return knex("task").then(() => {
    // Inserts seed entries
    return knex("task").insert(items);
  });
};
