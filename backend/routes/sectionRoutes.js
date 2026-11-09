const express = require("express");
const controller = require("../controllers/sectionController");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();
router.get("/", asyncHandler(controller.listPublicSections));
module.exports = router;
