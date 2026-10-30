const AppError = require("../utils/AppError");

module.exports = (schema, target = "body") => (req, _res, next) => {
  const { error, value } = schema.validate(req[target], {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });
  if (error) return next(new AppError(400, "Invalid request data", "VALIDATION_ERROR"));
  if (target === "query") req.validatedQuery = value;
  else req[target] = value;
  return next();
};
