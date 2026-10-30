const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  refreshTokenHash: {
    type: String,
    required: true,
    select: false,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  },
  revokedAt: {
    type: Date,
    default: null,
  },
  device: {
    type: String,
    maxlength: 300,
    default: "",
  },
  ipAddress: {
    type: String,
    maxlength: 64,
    default: "",
  },
}, {
  timestamps: {
    createdAt: true,
    updatedAt: false,
  },
});

module.exports = mongoose.models.Session || mongoose.model("Session", sessionSchema);
