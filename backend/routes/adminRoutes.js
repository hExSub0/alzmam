const express = require("express");
const adminController = require("../controllers/adminController");
const isAuth = require("../middlewares/isAuth");
const isAdmin = require("../middlewares/isAdmin");
const validate = require("../middlewares/validate");
const schemas = require("../validations/schemas");
const asyncHandler = require("../utils/asyncHandler");
const productController = require("../controllers/productController");
const productSchema = require("../validations/product-validation");
const storeController = require("../controllers/storeController");
const Joi = require("joi");
const sectionController = require("../controllers/sectionController");
const orderController = require("../controllers/orderController");
const { uploadSectionBanner, parseSectionPayload } = require("../middlewares/sectionBannerUpload");
const {
  parseProductImagePositions,
  parseProductOptions,
  uploadProductImages,
} = require("../middlewares/productImageUpload");

const router = express.Router();

router.use(isAuth, isAdmin);
router.get("/orders", asyncHandler(orderController.listAllOrders));
router.patch("/orders/:id/status", validate(schemas.id, "params"), validate(schemas.orderStatus), asyncHandler(orderController.updateOrderStatus));
const sectionPayload = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  banner: Joi.object({
    src: Joi.string().trim().allow("").max(2048).default(""),
    alt: Joi.string().trim().allow("").max(160).default(""),
    link: Joi.string().trim().allow("").max(2048).default(""),
  }).default({}),
  sortOrder: Joi.number().integer().min(0).max(10000).default(0),
  isActive: Joi.boolean().default(true),
}).required();
router.get("/sections", asyncHandler(sectionController.listAdminSections));
router.post("/sections", uploadSectionBanner, parseSectionPayload, validate(sectionPayload), asyncHandler(sectionController.createSection));
router.patch("/sections/:id", validate(schemas.id, "params"), uploadSectionBanner, parseSectionPayload, validate(sectionPayload), asyncHandler(sectionController.updateSection));
router.delete("/sections/:id", validate(schemas.id, "params"), asyncHandler(sectionController.deleteSection));
router.put("/banners", validate(Joi.object({
  banners: Joi.array().items(Joi.object({
    src: Joi.string().trim().min(1).max(2048).required(),
    alt: Joi.string().trim().allow("").max(160).default(""),
  }).required()).max(20).required(),
}).required()), asyncHandler(storeController.updateBanners));
router.get("/products", asyncHandler(productController.listAdminProducts));
router.post(
  "/products",
  uploadProductImages,
  parseProductImagePositions,
  parseProductOptions,
  validate(productSchema),
  asyncHandler(productController.createProduct),
);
router.patch(
  "/products/:id",
  validate(schemas.id, "params"),
  uploadProductImages,
  parseProductImagePositions,
  parseProductOptions,
  validate(productSchema),
  asyncHandler(productController.updateProduct),
);
router.delete(
  "/products/:id",
  validate(schemas.id, "params"),
  asyncHandler(productController.deleteProduct),
);
router.get(
  "/users",
  validate(schemas.pagination, "query"),
  asyncHandler(adminController.listUsers),
);
router.get(
  "/users/:id",
  validate(schemas.id, "params"),
  asyncHandler(adminController.getUser),
);
router.patch(
  "/users/:id/role",
  validate(schemas.id, "params"),
  validate(schemas.role),
  asyncHandler(adminController.updateRole),
);
router.patch(
  "/users/:id/status",
  validate(schemas.id, "params"),
  validate(schemas.status),
  asyncHandler(adminController.updateStatus),
);

module.exports = router;
