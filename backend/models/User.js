const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 120,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 254,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  passwordChangedAt: {
    type: Date,
    default: null,
  },
  emailVerificationHash: {
    type: String,
    select: false,
  },
  emailVerificationExpiresAt: {
    type: Date,
    select: false,
  },
  emailVerificationAttempts: {
    type: Number,
    default: 0,
    select: false,
  },
  emailVerificationSentAt: {
    type: Date,
    select: false,
  },
  passwordResetHash: {
    type: String,
    select: false,
  },
  passwordResetExpiresAt: {
    type: Date,
    select: false,
  },
}, {
  timestamps: true,
});

userSchema.set("toJSON", {
  transform(_document, returnedUser) {
    delete returnedUser.password;
    delete returnedUser.emailVerificationHash;
    delete returnedUser.emailVerificationExpiresAt;
    delete returnedUser.emailVerificationAttempts;
    delete returnedUser.emailVerificationSentAt;
    delete returnedUser.passwordResetHash;
    delete returnedUser.passwordResetExpiresAt;
    delete returnedUser.__v;

    return returnedUser;
  },
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
