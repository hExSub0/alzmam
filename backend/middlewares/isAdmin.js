const AppError = require("../utils/AppError");

const requireAdmin = (req, _res, next) => {
  const isAdministrator = req.user?.role === "admin";

  if (!isAdministrator) {
    return next(new AppError(403, "يتطلب هذا الإجراء صلاحية المسؤول.", "FORBIDDEN"));
  }

  return next();
};

module.exports = requireAdmin;
