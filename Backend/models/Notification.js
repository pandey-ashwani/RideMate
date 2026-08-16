import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: [
        'booking_request',
        'owner_accepted',
        'owner_rejected',
        'booking_confirmed',
        'booking_completed',
        'system'
      ],
      default: 'system'
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    read: {
      type: Boolean,
      default: false
    },
    smsStatus: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'not_sent'],
      default: 'pending'
    },
    emailStatus: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'not_sent'],
      default: 'pending'
    },
    smsError: {
      type: String,
      default: ''
    },
    emailError: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
