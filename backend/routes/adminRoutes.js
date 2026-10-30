const express = require("express");
const adminController = require("../controllers/adminController");
const isAuth = require("../middlewares/isAuth");
const isAdmin = require("../middlewares/isAdmin");
const validate = require("../middlewares/validate");
const schemas = require("../validations/schemas");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.use(isAuth, isAdmin);
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
