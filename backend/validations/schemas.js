const Joi = require("joi");

const emailSchema = Joi.string()
  .trim()
  .lowercase()
  .email({ tlds: { allow: false } })
  .max(254)
  .required();

const passwordSchema = Joi.string()
  .min(8)
  .pattern(/[A-Z]/)
  .pattern(/[a-z]/)
  .pattern(/[0-9]/)
  .pattern(/[^A-Za-z0-9]/)
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

const orderStatusSchema = Joi.object({
  status: Joi.string().valid("pending", "confirmed", "shipped", "delivered", "cancelled").required(),
}).required();

const idSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
}).required();

const productIdentifierSchema = Joi.object({
  id: Joi.string()
    .pattern(/^(?:[a-f\d]{24}|[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*)$/iu)
    .required(),
}).required();

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).max(100000).default(1),
  limit: Joi.number().integer().min(1).max(100).default(25),
}).required();

const orderSchema = Joi.object({
  paymentMethod: Joi.string().valid("cash_on_delivery").default("cash_on_delivery"),
  customer: Joi.object({
    name: Joi.string().trim().min(2).max(120).required(),
    email: emailSchema,
    phone: Joi.string().trim()
      .pattern(/^\+?[0-9\u0660-\u0669\u06f0-\u06f9][0-9\u0660-\u0669\u06f0-\u06f9\s()-]{7,18}$/u)
      .custom((phone, helpers) => {
        const localPhone = phone
          .replace(/^\+?966\s*/, "")
          .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
          .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
        return /^5\d{8}$/.test(localPhone) ? phone : helpers.error("string.pattern.base");
      })
      .required(),
    city: Joi.string().trim().min(2).max(100).required(),
    address: Joi.string().trim().min(5).max(500).required(),
  }).required(),
  items: Joi.array().items(Joi.object({
    productId: Joi.string().hex().length(24).required(),
    quantity: Joi.number().integer().min(1).max(99).required(),
    note: Joi.string().trim().max(500).allow("").default(""),
    attachments: Joi.array().items(Joi.object({
      name: Joi.string().trim().min(1).max(255).required(),
      url: Joi.string().pattern(/^\/uploads\/order-attachments\/[a-f\d-]{36}\.(?:jpg|png|webp|avif|pdf)$/i).required(),
      contentType: Joi.string().valid("image/jpeg", "image/png", "image/webp", "image/avif", "application/pdf").required(),
      size: Joi.number().integer().min(1).max(5 * 1024 * 1024).required(),
    })).max(5).default([]),
    options: Joi.object().pattern(
      Joi.string().trim().min(1).max(80),
      Joi.string().trim().min(1).max(120),
    ).max(20).default({}),
  })).min(1).max(50).required(),
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
  orderStatus: orderStatusSchema,
  id: idSchema,
  productIdentifier: productIdentifierSchema,
  pagination: paginationSchema,
  order: orderSchema,
};
