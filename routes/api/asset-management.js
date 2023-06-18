const express = require("express");
const router = express.Router();
const AssetController = require("../../controller/api/asset-management");
const guard = require("express-jwt-permissions")();
const permissions = [["admin"], ["manager"], ["leader"], ["developer"], ["tester"], ["asset_admin"], ["accountant"]];

router.get("/asset-management/asset/users", guard.check(permissions), AssetController.fetchUsers);
router.get("/asset-management/asset/companies", guard.check(permissions), AssetController.fetchCompanies);
router.get("/asset-management/asset/status", guard.check(permissions), AssetController.fetchStatus);
router.get("/asset-management/asset/purposes", guard.check(permissions), AssetController.fetchPurposes);
router.get("/asset-management/asset/status-by-id", guard.check(permissions), AssetController.getStatusByID);

router.get("/asset-management/asset-type", guard.check(permissions), AssetController.fetchAssetTypes);
router.post("/asset-management/asset-type", guard.check(permissions), AssetController.addAssetType);
router.put("/asset-management/asset-type", guard.check(permissions), AssetController.editAssetType);
router.delete("/asset-management/asset-type", guard.check(permissions), AssetController.deleteAssetType);
router.post("/asset-management/asset-type/restore", guard.check(permissions), AssetController.restoreAssetType);
router.post("/asset-management/asset-type/restore-all", guard.check(permissions), AssetController.restoreAllAssetType);

router.get("/asset-management/asset", guard.check(permissions), AssetController.fetchAssets);
router.get("/asset-management/asset-by-id", guard.check(permissions), AssetController.getAssetByID);
router.get("/asset-management/asset-by-join", guard.check(permissions), AssetController.fetchAssetByJoin);
router.post("/asset-management/asset", guard.check(permissions), AssetController.addAsset);
router.put("/asset-management/asset", guard.check(permissions), AssetController.editAsset);
router.delete("/asset-management/asset", guard.check(permissions), AssetController.deleteAsset);
router.post("/asset-management/asset-export-excel", guard.check(permissions), AssetController.exportAssetToExcel);

router.post("/asset-management/asset/bind", guard.check(permissions), AssetController.bindManager);
router.get("/asset-management/asset/bind-confirm", AssetController.bindConfirm);
router.post("/asset-management/asset/change-status", guard.check(permissions), AssetController.changeStatus);

module.exports = router;
