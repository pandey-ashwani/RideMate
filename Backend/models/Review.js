import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    customerName: { type: String, required: true },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    text: { type: String, required: true },
    date: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

const Review = mongoose.model('Review', reviewSchema);
export default Review;
