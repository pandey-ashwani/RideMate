import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brand: { type: String, required: true },
    type: {
      type: String,
      enum: ['car', 'bike', 'scooter'],
      required: true
    },
    pricePerDay: { type: Number, required: true },
    image: { type: String },
    specs: {
      transmission: { type: String, default: 'Automatic' },
      fuel: { type: String, default: 'Electric' },
      seats: { type: Number, default: 4 },
      range: { type: String, default: '250 miles' }
    },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    availability: { type: Boolean, default: true },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    location: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved'],
      default: 'pending'
    },
    description: { type: String }
  },
  {
    timestamps: true
  }
);

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;
