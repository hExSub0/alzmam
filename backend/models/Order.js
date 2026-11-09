const mongoose = require("mongoose");

const orderAttachmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 255 },
  url: { type: String, required: true, trim: true, maxlength: 2048 },
  contentType: { type: String, required: true, trim: true, maxlength: 100 },
  size: { type: Number, required: true, min: 1, max: 5 * 1024 * 1024 },
}, { _id: false });

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  image: { type: String, trim: true, maxlength: 2048, default: "" },
  slug: { type: String, trim: true, maxlength: 180, default: "" },
  unitPrice: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1, max: 99 },
  options: { type: Map, of: String, default: {} },
  note: { type: String, trim: true, maxlength: 500, default: "" },
  attachments: { type: [orderAttachmentSchema], default: [] },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  items: { type: [orderItemSchema], required: true },
  customer: {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    address: { type: String, required: true, trim: true, maxlength: 500 },
  },
  total: { type: Number, required: true, min: 0 },
  paymentMethod: {
    type: String,
    enum: ["cash_on_delivery", "visa"],
    default: "cash_on_delivery",
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
    default: "pending",
  },
}, { timestamps: true });

orderSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
