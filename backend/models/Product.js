const mongoose = require("mongoose");

const productOptionSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true,
    maxlength: 80,
  },
  pricingMode: {
    type: String,
    enum: ["none", "additive", "fixed"],
    default: "additive",
  },
  values: {
    type: [{
      type: String,
      trim: true,
      maxlength: 120,
    }],
    required: true,
    validate: {
      validator(values) {
        return values.length >= 2 && values.length <= 20;
      },
      message: "يجب أن يحتوي كل خيار على قيمتين على الأقل.",
    },
  },
  valuePrices: {
    type: [{ type: Number, min: 0, max: 100000000 }],
    default: [],
    validate: {
      validator(prices) {
        return prices.length === 0 || prices.length === this.values.length;
      },
      message: "يجب تحديد سعر إضافي لكل قيمة من قيم الخيار.",
    },
  },
  valuePricingModes: {
    type: [{ type: String, enum: ["none", "additive", "fixed"] }],
    default: [],
    validate: {
      validator(modes) {
        return modes.length === 0 || modes.length === this.values.length;
      },
      message: "Each dropdown value must have a pricing mode.",
    },
  },
}, {
  _id: false,
});

const productSchema = new mongoose.Schema({
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Section",
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 160,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 10000,
  },
  images: {
    type: [{
      type: String,
      trim: true,
    }],
    required: true,
    validate: {
      validator(images) {
        return images.length >= 1 && images.length <= 5;
      },
      message: "Each product dropdown must include at least two values.",
    },
  },
  options: {
    type: [productOptionSchema],
    default: [],
    validate: {
      validator(options) {
        return options.length <= 20
          && options.filter((option) => (option.valuePricingModes || []).includes("fixed")).length <= 1;
      },
      message: "يمكن لقائمة واحدة فقط تحديد السعر النهائي للمنتج.",
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

productSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);
