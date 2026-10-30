const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const createOpaqueToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const signAccessToken = (user) => {
  const payload = { sub: user.id };
  const options = {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
    issuer: "eco-api",
    audience: "eco-client",
  };

  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, options);
};

const signRefreshToken = (userId, sessionId) => {
  const payload = {
    sub: userId,
    sid: sessionId,
  };
  const options = {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "14d",
    issuer: "eco-api",
    audience: "eco-refresh",
    jwtid: crypto.randomUUID(),
  };

  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, options);
};

module.exports = {
  hashToken,
  createOpaqueToken,
  signAccessToken,
  signRefreshToken,
};
