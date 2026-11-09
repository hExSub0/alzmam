const AppError = require("../utils/AppError");

const validate = (schema, target = "body") => (req, _res, next) => {
  const requestValue = req[target];
  const validationResult = schema.validate(requestValue, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (validationResult.error) {
    return next(new AppError(400, "البيانات المدخلة غير صحيحة.", "VALIDATION_ERROR"));
  }

  if (target === "query") {
    req.validatedQuery = validationResult.value;
    return next();
  }

  req[target] = validationResult.value;
  return next();
};

module.exports = validate;
