const crypto = require("node:crypto");
const AppError = require("../utils/AppError");

const TOKEN_NONCE_PATTERN = /^[a-f0-9]{64}$/;
const TOKEN_SIGNATURE_PATTERN = /^[a-f0-9]{64}$/;
const SAFE_HTTP_METHODS = ["GET", "HEAD", "OPTIONS"];

const timingSafeEqual = (firstValue, secondValue) => {
  if (typeof firstValue !== "string" || typeof secondValue !== "string") {
    return false;
  }

  const firstBuffer = Buffer.from(firstValue);
  const secondBuffer = Buffer.from(secondValue);
  const buffersHaveSameLength = firstBuffer.length === secondBuffer.length;

  if (!buffersHaveSameLength) {
    return false;
  }

  return crypto.timingSafeEqual(firstBuffer, secondBuffer);
};

const createTokenSignature = (nonce) => {
  return crypto
    .createHmac("sha256", process.env.COOKIE_SECRET)
    .update(nonce)
    .digest("hex");
};

const issueCsrfToken = () => {
  const nonce = crypto.randomBytes(32).toString("hex");
  const signature = createTokenSignature(nonce);

  return `${nonce}.${signature}`;
};

const isValidToken = (token) => {
  if (typeof token !== "string") {
    return false;
  }

  const [nonce, signature, extraPart] = token.split(".");
  const hasUnexpectedPart = extraPart !== undefined;
  const hasValidNonce = TOKEN_NONCE_PATTERN.test(nonce || "");
  const hasValidSignature = TOKEN_SIGNATURE_PATTERN.test(signature || "");

  if (hasUnexpectedPart || !hasValidNonce || !hasValidSignature) {
    return false;
  }

  const expectedSignature = createTokenSignature(nonce);
  return timingSafeEqual(signature, expectedSignature);
};

const getAllowedOrigins = () => {
  const configuredOrigins = process.env.FRONTEND_URL || "http://localhost:3000";

  return configuredOrigins.split(",").map((origin) => origin.trim());
};

const csrfProtection = (req, _res, next) => {
  if (SAFE_HTTP_METHODS.includes(req.method)) {
    return next();
  }

  const requestOrigin = req.get("origin");
  const allowedOrigins = getAllowedOrigins();
  const originIsAllowed = !requestOrigin || allowedOrigins.includes(requestOrigin);

  if (!originIsAllowed) {
    return next(new AppError(403, "تم رفض الطلب.", "CSRF_REJECTED"));
  }

  const cookieToken = req.cookies?.csrfToken;
  const headerToken = req.get("x-csrf-token");
  const tokensMatch = timingSafeEqual(cookieToken, headerToken);
  const cookieTokenIsValid = isValidToken(cookieToken);

  if (!tokensMatch || !cookieTokenIsValid) {
    return next(new AppError(403, "تعذر التحقق من أمان الطلب. حدّث الصفحة وحاول مرة أخرى.", "CSRF_REJECTED"));
  }

  return next();
};

module.exports = {
  csrfProtection,
  issueCsrfToken,
};
