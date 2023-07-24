const express = require("express");
const router = express.Router();
const multer = require("multer");
const ProfileController = require("../../controller/api/profile");
const { editProfileValidator } = require("../../middleware/validator/edit-profile");
const upload = multer({ dest: "./assets/CV" });

router.get("/profile", ProfileController.getProfile);
router.put("/profile/edit", editProfileValidator(), upload.single("cv"), ProfileController.editProfile);
router.put("/profile/editGeneralScore", ProfileController.editProfileGeneralScore);

module.exports = router;
