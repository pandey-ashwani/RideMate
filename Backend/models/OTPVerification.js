import mongoose from 'mongoose';

const otpVerificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    identifier: {
      type: String,
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['phone', 'email'],
      required: true
    },
    otpHash: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 } // MongoDB TTL Index
    },
    attempts: {
      type: Number,
      default: 0
    },
    lastSentAt: {
      type: Date,
      default: Date.now
    },
    resendCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Compound index for fast lookup and rate limit enforcement
otpVerificationSchema.index({ user: 1, type: 1 });
otpVerificationSchema.index({ identifier: 1, type: 1 });

const OTPVerification = mongoose.model('OTPVerification', otpVerificationSchema);
export default OTPVerification;
