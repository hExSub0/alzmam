const Joi = require("joi");

const email = Joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(254).required();
const password = Joi.string().min(12).max(128).required();

const schemas = {
  register: Joi.object({
    name: Joi.string().trim().min(2).max(120),
    firstName: Joi.string().trim().min(1).max(60),
    lastName: Joi.string().trim().min(1).max(60),
    email,
    password,
  }).custom((value, helpers) => {
    if (!value.name && !(value.firstName && value.lastName)) return helpers.error("any.custom");
    if (value.name && (value.firstName || value.lastName)) return helpers.error("any.custom");
    return value;
  }).required(),
  login: Joi.object({ email, password: Joi.string().min(1).max(128).required() }).required(),
  verifyEmail: Joi.object({ email, code: Joi.string().pattern(/^\d{6}$/).required() }).required(),
  resendVerification: Joi.object({ email }).required(),
  forgotPassword: Joi.object({ email }).required(),
  resetPassword: Joi.object({ token: Joi.string().hex().length(64).required(), password }).required(),
  changePassword: Joi.object({
    currentPassword: Joi.string().min(1).max(128).required(),
    password,
  }).required(),
  role: Joi.object({ role: Joi.string().valid("user", "admin").required() }).required(),
  status: Joi.object({ isActive: Joi.boolean().required() }).required(),
  id: Joi.object({ id: Joi.string().hex().length(24).required() }).required(),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).max(100000).default(1),
    limit: Joi.number().integer().min(1).max(100).default(25),
  }).required(),
};

module.exports = schemas;
