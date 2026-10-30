const express = require("express");
const admin = require("../controllers/adminController");
const isAuth = require("../middlewares/isAuth");
const isAdmin = require("../middlewares/isAdmin");
const validate = require("../middlewares/validate");
const schemas = require("../validations/schemas");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();
router.use(isAuth, isAdmin);
router.get("/users", validate(schemas.pagination, "query"), asyncHandler(admin.listUsers));
router.get("/users/:id", validate(schemas.id, "params"), asyncHandler(admin.getUser));
router.patch("/users/:id/role", validate(schemas.id, "params"), validate(schemas.role), asyncHandler(admin.updateRole));
router.patch("/users/:id/status", validate(schemas.id, "params"), validate(schemas.status), asyncHandler(admin.updateStatus));

module.exports = router;
