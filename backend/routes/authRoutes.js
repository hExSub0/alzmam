const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const auth = require("../controllers/authController");
const schemas = require("../validations/schemas");
const validate = require("../middlewares/validate");
const isAuth = require("../middlewares/isAuth");
const { csrfProtection } = require("../middlewares/csrf");
const { sensitiveLimiter, loginLimiter } = require("../middlewares/rateLimits");

const router = express.Router();
router.use(csrfProtection);
router.get("/csrf", asyncHandler(auth.csrf));
router.post("/register", sensitiveLimiter, validate(schemas.register), asyncHandler(auth.register));
router.post("/login", loginLimiter, validate(schemas.login), asyncHandler(auth.login));
router.post("/refresh", sensitiveLimiter, asyncHandler(auth.refresh));
router.post("/logout", sensitiveLimiter, asyncHandler(auth.logout));
router.post("/logout-all", sensitiveLimiter, isAuth, asyncHandler(auth.logoutAll));
router.get("/me", isAuth, asyncHandler(auth.me));
router.post("/verify-email", sensitiveLimiter, validate(schemas.verifyEmail), asyncHandler(auth.verifyEmail));
router.post("/resend-verification", sensitiveLimiter, validate(schemas.resendVerification), asyncHandler(auth.resendVerification));
router.post("/forgot-password", sensitiveLimiter, validate(schemas.forgotPassword), asyncHandler(auth.forgotPassword));
router.post("/reset-password", sensitiveLimiter, validate(schemas.resetPassword), asyncHandler(auth.resetPassword));
router.patch("/change-password", sensitiveLimiter, isAuth, validate(schemas.changePassword), asyncHandler(auth.changePassword));
router.get("/sessions", isAuth, asyncHandler(auth.listSessions));
router.delete("/sessions/:id", isAuth, validate(schemas.id, "params"), asyncHandler(auth.revokeSession));

module.exports = router;
