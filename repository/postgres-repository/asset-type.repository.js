const knex = require("../../config/database.js");

module.exports.getAll = () => {
  return knex.raw(`with count_table as (select asset_type_id, count(asset_type_id) from asset
  group by asset_type_id)
  select id, asset_type_code, asset_type_name , created_id, count_table.count, delete_flag, created_at, description 
  from asset_type
  left join count_table
  on asset_type.id = count_table.asset_type_id`);
};

module.exports.insert = assetType => {
  return knex("asset_type").insert(assetType);
};

module.exports.update = (assetType, condition) => {
  return knex("asset_type").update(assetType).where(condition);
};

module.exports.getAllByCondition = condition => {
  return knex.select().from("asset_type").where(condition);
};

module.exports.deleteByCondition = condition => {
  return knex("asset_type").where(condition).del();
};

module.exports.getAssetTypeIfExistAsset = condition => {
  return knex
    .column("asset_type.id")
    .select()
    .from("asset_type")
    .leftJoin("asset", "asset.asset_type_id", "asset_type.id")
    .where(condition);
};

module.exports.decrementByCondition = (trx, step, condition) => {
  if (trx) return trx("asset_type").where(condition).decrement("count", step);
  return knex("asset_type").where(condition).decrement("count", step);
};
