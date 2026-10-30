const express = require("express");
const authController = require("../controllers/authController");
const schemas = require("../validations/schemas");
const validate = require("../middlewares/validate");
const isAuth = require("../middlewares/isAuth");
const { csrfProtection } = require("../middlewares/csrf");
const { sensitiveLimiter, loginLimiter } = require("../middlewares/rateLimits");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.use(csrfProtection);

router.get("/csrf", asyncHandler(authController.csrf));
router.post(
  "/register",
  sensitiveLimiter,
  validate(schemas.register),
  asyncHandler(authController.register),
);
router.post(
  "/login",
  loginLimiter,
  validate(schemas.login),
  asyncHandler(authController.login),
);
router.post("/refresh", sensitiveLimiter, asyncHandler(authController.refresh));
router.post("/logout", sensitiveLimiter, asyncHandler(authController.logout));
router.post(
  "/logout-all",
  sensitiveLimiter,
  isAuth,
  asyncHandler(authController.logoutAll),
);
router.get("/me", isAuth, asyncHandler(authController.me));
router.post(
  "/verify-email",
  sensitiveLimiter,
  validate(schemas.verifyEmail),
  asyncHandler(authController.verifyEmail),
);
router.post(
  "/resend-verification",
  sensitiveLimiter,
  validate(schemas.resendVerification),
  asyncHandler(authController.resendVerification),
);
router.post(
  "/forgot-password",
  sensitiveLimiter,
  validate(schemas.forgotPassword),
  asyncHandler(authController.forgotPassword),
);
router.post(
  "/reset-password",
  sensitiveLimiter,
  validate(schemas.resetPassword),
  asyncHandler(authController.resetPassword),
);
router.patch(
  "/change-password",
  sensitiveLimiter,
  isAuth,
  validate(schemas.changePassword),
  asyncHandler(authController.changePassword),
);
router.get("/sessions", isAuth, asyncHandler(authController.listSessions));
router.delete(
  "/sessions/:id",
  isAuth,
  validate(schemas.id, "params"),
  asyncHandler(authController.revokeSession),
);

module.exports = router;
