const express = require("express");
const router = express.Router();
const guard = require("express-jwt-permissions")();
const DocumentController = require("../../controller/api-v2/document-management.controller");
const permissions = [["admin"]];

// Category
router.route("/document-management/category").get(guard.check(permissions), DocumentController.getListCategories);
router.route("/document-management/category").post(guard.check(permissions), DocumentController.updateOrCreateCategory);
router.route("/document-management/category/:id").delete(guard.check(permissions), DocumentController.deleteCategory);

// Specification Type
router.route("/document-management/spec-type").get(guard.check(permissions), DocumentController.getAllSpec);

// Get last doc_number by specId
router.route("/document-management/last-number").get(guard.check(permissions), DocumentController.getLastDocNum);

// Tags
router.route("/document-management/tags/search").get(guard.check(permissions), DocumentController.searchTag);
router
  .route("/document-management/tags")
  .get(guard.check(permissions), DocumentController.getAllTags)
  .post(guard.check(permissions), DocumentController.createTag);

// Document
router.route("/document-management/search").post(guard.check(permissions), DocumentController.searchDocument);
router.route("/document-management/upload").post(guard.check(permissions), DocumentController.updateOrCreateDocument);
router
  .route("/document-management/:id")
  .get(guard.check(permissions), DocumentController.getDocumentById)
  .delete(guard.check(permissions), DocumentController.deleteDocument);

module.exports = router;
