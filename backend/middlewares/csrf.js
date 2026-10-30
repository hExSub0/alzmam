const crypto = require("node:crypto");
const AppError = require("../utils/AppError");

const safeEqual = (left, right) => {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const issueCsrfToken = () => {
  const nonce = crypto.randomBytes(32).toString("hex");
  const signature = crypto.createHmac("sha256", process.env.COOKIE_SECRET).update(nonce).digest("hex");
  return `${nonce}.${signature}`;
};

const isValidToken = (token) => {
  if (typeof token !== "string") return false;
  const [nonce, signature, extra] = token.split(".");
  if (extra !== undefined || !/^[a-f0-9]{64}$/.test(nonce || "") || !/^[a-f0-9]{64}$/.test(signature || "")) return false;
  const expected = crypto.createHmac("sha256", process.env.COOKIE_SECRET).update(nonce).digest("hex");
  return safeEqual(signature, expected);
};

const csrfProtection = (req, _res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.get("origin");
  const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000").split(",").map((entry) => entry.trim());
  if (origin && !allowedOrigins.includes(origin)) return next(new AppError(403, "Request rejected", "CSRF_REJECTED"));
  const cookieToken = req.cookies?.csrfToken;
  const headerToken = req.get("x-csrf-token");
  if (!safeEqual(cookieToken, headerToken) || !isValidToken(cookieToken)) return next(new AppError(403, "CSRF token is missing or invalid", "CSRF_REJECTED"));
  return next();
};

module.exports = { csrfProtection, issueCsrfToken };
