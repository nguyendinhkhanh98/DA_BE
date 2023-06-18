const knex = require("../../config/database.js");

module.exports.getAssetByAssetTypeId = asset_type_id => {
  return bodyQueryAssetFullInfo().where({ asset_type_id });
};

module.exports.getAll = () => {
  return knex.select().from("asset");
};

module.exports.getAllByCondition = condition => {
  return knex.select().from("asset").where(condition);
};

module.exports.getAssetFullInfo = () => {
  return bodyQueryAssetFullInfo();
};

module.exports.getAssetFullInfoByCondition = condition => {
  return bodyQueryAssetFullInfo().where(condition);
};

module.exports.update = (trx, asset, condition) => {
  if (trx) return trx("asset").update(asset).where(condition);
  return knex("asset").update(asset).where(condition);
};

module.exports.deleteAsset = (trx, condition) => {
  if (trx) return trx("asset").where(condition).del();
  return knex("asset").where(condition).del();
};

module.exports.getAssetByOrderFields = () => {
  return knex("asset")
    .column(
      { id: "asset.id" },
      "asset_code",
      { asset_type: "asset_type.asset_type_name" },
      "asset_info",
      { purpose: "purpose.name" },
      { status: "status.name" },
      { manager: "user_profile.full_name" },
      { company: "company.name" },
      "note",
      "asset.buy_date",
      "asset.created_at"
    )
    .select()
    .leftJoin("asset_type", "asset.asset_type_id", "asset_type.id")
    .leftJoin("purpose", "asset.purpose_id", "purpose.id")
    .leftJoin("user_profile", "asset.manager_id", "user_profile.id")
    .leftJoin("company", "asset.company_id", "company.id")
    .leftJoin("status", "asset.status_id", "status.id");
};

const bodyQueryAssetFullInfo = () => {
  return knex("asset")
    .column(
      "asset_code",
      "asset_info",
      "note",
      "qr_code",
      "asset.created_at",
      "asset_type_id",
      "asset.buy_date",
      "purpose_id",
      {
        asset_type: "asset_type.asset_type_name",
        id: "asset.id",
        purpose: "purpose.name",
        manager: "user_profile.full_name",
        manager_id: "user_profile.id",
        company: "company.name",
        status: "status.name",
        status_id: "status.id"
      }
    )
    .select()
    .leftJoin("asset_type", "asset.asset_type_id", "asset_type.id")
    .leftJoin("purpose", "asset.purpose_id", "purpose.id")
    .leftJoin("user_profile", "asset.manager_id", "user_profile.id")
    .leftJoin("company", "asset.company_id", "company.id")
    .leftJoin("status", "asset.status_id", "status.id");
};
