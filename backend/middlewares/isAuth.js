const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");

module.exports = async (req, _res, next) => {
  const [scheme, token] = String(req.get("authorization") || "").split(" ");
  if (scheme !== "Bearer" || !token) return next(new AppError(401, "Authentication required", "AUTH_REQUIRED"));
  let payload;
  try {
    payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, { issuer: "eco-api", audience: "eco-client" });
  } catch {
    return next(new AppError(401, "Authentication required", "AUTH_REQUIRED"));
  }
  const user = await User.findOne({ _id: payload.sub, isActive: true });
  if (!user || (user.passwordChangedAt && payload.iat * 1000 < user.passwordChangedAt.getTime())) {
    return next(new AppError(401, "Authentication required", "AUTH_REQUIRED"));
  }
  req.user = user;
  return next();
};
