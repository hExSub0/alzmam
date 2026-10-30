const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const SENSITIVE_REQUEST_LIMIT = 20;
const LOGIN_REQUEST_LIMIT = 8;
const RATE_LIMIT_RESPONSE = {
  error: {
    code: "RATE_LIMITED",
    message: "Too many requests. Please try again later.",
  },
};

const createRateLimiter = ({ limit, keyGenerator }) => {
  return rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator,
    message: RATE_LIMIT_RESPONSE,
  });
};

const getLoginRateLimitKey = (req) => {
  const ipAddress = ipKeyGenerator(req.ip);
  const normalizedEmail = String(req.body?.email || "").trim().toLowerCase();

  return `${ipAddress}:${normalizedEmail}`;
};

const sensitiveLimiter = createRateLimiter({
  limit: SENSITIVE_REQUEST_LIMIT,
});

const loginLimiter = createRateLimiter({
  limit: LOGIN_REQUEST_LIMIT,
  keyGenerator: getLoginRateLimitKey,
});

module.exports = {
  sensitiveLimiter,
  loginLimiter,
};
