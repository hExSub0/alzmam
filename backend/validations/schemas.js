const Joi = require("joi");

const emailSchema = Joi.string()
  .trim()
  .lowercase()
  .email({ tlds: { allow: false } })
  .max(254)
  .required();

const passwordSchema = Joi.string()
  .min(12)
  .max(128)
  .required();

const registrationSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120),
  firstName: Joi.string().trim().min(1).max(60),
  lastName: Joi.string().trim().min(1).max(60),
  email: emailSchema,
  password: passwordSchema,
})
  .custom((value, helpers) => {
    const hasFullName = Boolean(value.name);
    const hasFirstAndLastName = Boolean(value.firstName && value.lastName);
    const hasPartialSplitName = Boolean(value.firstName || value.lastName);

    if (!hasFullName && !hasFirstAndLastName) {
      return helpers.error("any.custom");
    }

    if (hasFullName && hasPartialSplitName) {
      return helpers.error("any.custom");
    }

    return value;
  })
  .required();

const loginSchema = Joi.object({
  email: emailSchema,
  password: Joi.string().min(1).max(128).required(),
}).required();

const verificationSchema = Joi.object({
  email: emailSchema,
  code: Joi.string().pattern(/^\d{6}$/).required(),
}).required();

const emailOnlySchema = Joi.object({
  email: emailSchema,
}).required();

const passwordResetSchema = Joi.object({
  token: Joi.string().hex().length(64).required(),
  password: passwordSchema,
}).required();

const passwordChangeSchema = Joi.object({
  currentPassword: Joi.string().min(1).max(128).required(),
  password: passwordSchema,
}).required();

const roleUpdateSchema = Joi.object({
  role: Joi.string().valid("user", "admin").required(),
}).required();

const statusUpdateSchema = Joi.object({
  isActive: Joi.boolean().required(),
}).required();

const idSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
}).required();

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).max(100000).default(1),
  limit: Joi.number().integer().min(1).max(100).default(25),
}).required();

module.exports = {
  register: registrationSchema,
  login: loginSchema,
  verifyEmail: verificationSchema,
  resendVerification: emailOnlySchema,
  forgotPassword: emailOnlySchema,
  resetPassword: passwordResetSchema,
  changePassword: passwordChangeSchema,
  role: roleUpdateSchema,
  status: statusUpdateSchema,
  id: idSchema,
  pagination: paginationSchema,
};
