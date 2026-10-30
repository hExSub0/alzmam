const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const createOpaqueToken = () => crypto.randomBytes(32).toString("hex");

const signAccessToken = (user) => jwt.sign({ sub: user.id }, process.env.ACCESS_TOKEN_SECRET, {
  expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  issuer: "eco-api",
  audience: "eco-client",
});

const signRefreshToken = (userId, sessionId) => jwt.sign({ sub: userId, sid: sessionId }, process.env.REFRESH_TOKEN_SECRET, {
  expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "14d",
  issuer: "eco-api",
  audience: "eco-refresh",
  jwtid: crypto.randomUUID(),
});

module.exports = { hashToken, createOpaqueToken, signAccessToken, signRefreshToken };
