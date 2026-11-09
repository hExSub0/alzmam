const Joi = require("joi");

const productOptionSchema = Joi.object({
  label: Joi.string().trim().min(1).max(80).required(),
  pricingMode: Joi.string().valid("none", "additive", "fixed").default("additive"),
  values: Joi.array()
    .items(Joi.string().trim().min(1).max(120))
    .min(2)
    .max(20)
    .required(),
  valuePrices: Joi.array()
    .items(Joi.number().min(0).max(100000000).required())
    .min(2)
    .max(20)
    .required(),
  valuePricingModes: Joi.array()
    .items(Joi.string().valid("none", "additive", "fixed").required())
    .min(2)
    .max(20)
    .required(),
}).custom((option, helpers) => {
  if (option.values.length !== option.valuePrices.length || option.values.length !== option.valuePricingModes.length) {
    return helpers.error("any.invalid");
  }
  return option;
});

const productSchema = Joi.object({
  sectionId: Joi.string().hex().length(24).required(),
  name: Joi.string().trim().min(2).max(160).required(),
  price: Joi.number().min(0).max(100000000).required(),
  description: Joi.string().trim().min(1).max(10000).required(),
  options: Joi.array().items(productOptionSchema).max(20).default([]),
  isActive: Joi.boolean().default(true),
}).custom((product, helpers) => {
  const fixedPriceOptions = product.options.filter((option) => option.valuePricingModes.includes("fixed"));
  if (fixedPriceOptions.length > 1) return helpers.error("any.invalid");
  return product;
}).required();

module.exports = productSchema;
