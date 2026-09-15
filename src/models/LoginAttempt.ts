import mongoose from "mongoose";

const loginAttemptSchema = new mongoose.Schema(
  {
    ip: {
      type: String,
      required: true,
      unique: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    blockedUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export const LoginAttempt =
  mongoose.models.LoginAttempt ||
  mongoose.model("LoginAttempt", loginAttemptSchema);
