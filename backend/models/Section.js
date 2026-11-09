const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 120 },
  banner: {
    src: { type: String, trim: true, maxlength: 2048, default: "" },
    alt: { type: String, trim: true, maxlength: 160, default: "" },
    link: { type: String, trim: true, maxlength: 2048, default: "" },
  },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

sectionSchema.index({ isActive: 1, sortOrder: 1, createdAt: 1 });

module.exports = mongoose.models.Section || mongoose.model("Section", sectionSchema);
