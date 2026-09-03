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
});

export const User = mongoose.models.User || mongoose.model("User", userSchema);
