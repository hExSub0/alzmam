const AppError = require("../utils/AppError");

module.exports = (req, _res, next) => {
  if (req.user?.role !== "admin") return next(new AppError(403, "Administrator access required", "FORBIDDEN"));
  return next();
};
