const AppError = require("../utils/AppError");

const handleDuplicateKeyError = (error) => {
  if (error.code !== 11000) {
    return null;
  }

  return new AppError(
    409,
    "يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل.",
    "EMAIL_EXISTS",
  );
};

const handleMongooseValidationError = (error) => {
  const isValidationError = error.name === "ValidationError";
  const isCastError = error.name === "CastError";

  if (!isValidationError && !isCastError) {
    return null;
  }

  return new AppError(400, "البيانات المدخلة غير صحيحة.", "VALIDATION_ERROR");
};

const logUnexpectedError = (error) => {
  const logEntry = {
    event: "request_error",
    name: error.name || "Error",
    code: error.code || "INTERNAL_ERROR",
  };

  console.error(JSON.stringify(logEntry));
};

module.exports = (error, _req, res, _next) => {
  const normalizedError = handleDuplicateKeyError(error)
    || handleMongooseValidationError(error)
    || error;
  const isKnownError = normalizedError instanceof AppError;
  const statusCode = normalizedError.statusCode || 500;
  let message = normalizedError.message;
  let code = normalizedError.code || "INTERNAL_ERROR";

  if (!isKnownError && statusCode >= 500) {
    logUnexpectedError(error);
    message = "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
    code = "INTERNAL_ERROR";
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
};
