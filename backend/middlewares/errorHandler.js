const AppError = require("../utils/AppError");

module.exports = (error, _req, res, _next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message;
  let code = error.code || "INTERNAL_ERROR";

  if (error.code === 11000) {
    statusCode = 409;
    message = "An account with this email already exists";
    code = "EMAIL_EXISTS";
  } else if (error.name === "ValidationError" || error.name === "CastError") {
    statusCode = 400;
    message = "Invalid request data";
    code = "VALIDATION_ERROR";
  }

  if (!(error instanceof AppError) && statusCode >= 500) {
    console.error(JSON.stringify({ event: "request_error", name: error.name || "Error", code: error.code || "INTERNAL_ERROR" }));
    message = "An unexpected error occurred";
    code = "INTERNAL_ERROR";
  }

  res.status(statusCode).json({ error: { code, message } });
};
