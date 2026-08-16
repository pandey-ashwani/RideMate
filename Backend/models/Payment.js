import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: { type: Number, required: true },
    commission: { type: Number, required: true }, // platform share
    netPayout: { type: Number, required: true }, // owner share
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'completed'
    },
    transactionId: { type: String, required: true, unique: true },
    date: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
