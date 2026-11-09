const express = require("express");
const orderController = require("../controllers/orderController");
const isAuth = require("../middlewares/isAuth");
const validate = require("../middlewares/validate");
const { csrfProtection } = require("../middlewares/csrf");
const asyncHandler = require("../utils/asyncHandler");
const schemas = require("../validations/schemas");
const uploadOrderAttachments = require("../middlewares/orderAttachmentUpload");
const { sensitiveLimiter } = require("../middlewares/rateLimits");

const router = express.Router();

router.use(csrfProtection);
router.post("/attachments", sensitiveLimiter, uploadOrderAttachments, asyncHandler(orderController.saveOrderAttachments));
router.use(isAuth);
router.get("/", asyncHandler(orderController.listMyOrders));
router.post("/", validate(schemas.order), asyncHandler(orderController.createOrder));
router.patch("/:id/cancel", validate(schemas.id, "params"), asyncHandler(orderController.cancelMyOrder));

module.exports = router;
