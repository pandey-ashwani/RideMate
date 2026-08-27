import mongoose from 'mongoose';

const otpVerificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    email: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true
    },
    identifier: {
      type: String,
      index: true
    },
    type: {
      type: String,
      enum: ['email', 'phone'],
      default: 'email'
    },
    otpHash: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 } // MongoDB TTL Index for auto cleanup
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
    },
    purpose: {
      type: String,
      default: 'verification'
    },
    used: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast query resolution
otpVerificationSchema.index({ email: 1, used: 1 });
otpVerificationSchema.index({ identifier: 1, type: 1 });

const OTPVerification = mongoose.model('OTPVerification', otpVerificationSchema);
export default OTPVerification;
