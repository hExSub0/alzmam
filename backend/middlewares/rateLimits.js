const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${String(req.body?.email || "").trim().toLowerCase()}`,
  message: { error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } },
});

module.exports = { sensitiveLimiter, loginLimiter };
