const express = require("express");
const productController = require("../controllers/productController");
const validate = require("../middlewares/validate");
const asyncHandler = require("../utils/asyncHandler");
const productSchema = require("../validations/product-validation");
const schemas = require("../validations/schemas");

const router = express.Router();

router.get("/", asyncHandler(productController.listPublicProducts));
router.get(
  "/:id",
  validate(schemas.productIdentifier, "params"),
  asyncHandler(productController.getPublicProduct),
);

module.exports = router;
