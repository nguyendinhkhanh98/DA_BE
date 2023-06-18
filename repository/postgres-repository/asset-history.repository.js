const knex = require("../../config/database.js");

module.exports.getHistoryByAssetId = asset_id => {
  return knex("asset_history").select().where({ asset_id }).orderBy("created_at", "desc");
};

module.exports.getDistinctByAssetId = () => {
  return knex.raw(`select 
      DISTINCT ON (asset_id) asset_id,
      id,
      comment
    from asset_history
    order by asset_id, id desc;`);
};

module.exports.getAssetHistoryByCondition = condition => {
  return knex("asset_history").select().where(condition).orderBy("created_at", "desc");
};

module.exports.insert = (trx, assetHistory) => {
  if (trx) return trx("asset_history").insert(assetHistory);
  return knex("asset_history").insert(assetHistory);
};

module.exports.update = (trx, assetHistory, condition) => {
  if (trx) return trx("asset_history").update(assetHistory).where(condition);
  return knex("asset_history").update(assetHistory).where(condition);
};
