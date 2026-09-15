import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  image: {
    type: String,
  },

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  resetToken: {
    type: String,
    default: null,
  },
  resetTokenExpiry: {
    type: Date,
    default: null,
  },
  resetOtp: {
    type: String,
    default: null,
  },

  resetOtpExpiry: {
    type: Date,
    default: null,
  },

  resetOtpAttempts: {
    type: Number,
    default: 0,
  },
  lastResetOtpSentAt: {
    type: Date,
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
  },
  verificationTokenExpiry: {
    type: Date,
  },
  lastVerificationEmailSentAt: {
    type: Date,
    default: null,
  },
  failedLoginAttempts: {
    type: Number,
    default: 0,
  },

  lockedUntil: {
    type: Date,
    default: null,
  },
});

export const User = mongoose.models.User || mongoose.model("User", userSchema);
