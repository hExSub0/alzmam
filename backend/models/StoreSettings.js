const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
  src: { type: String, required: true, trim: true, maxlength: 2048 },
  alt: { type: String, trim: true, maxlength: 160, default: "" },
}, { _id: false });

const storeSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: "store" },
  banners: { type: [bannerSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.models.StoreSettings || mongoose.model("StoreSettings", storeSettingsSchema);
