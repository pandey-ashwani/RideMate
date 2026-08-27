import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
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
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    pickupDate: { type: Date, required: true },
    dropoffDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'owner_accepted', 'confirmed', 'approved', 'rejected', 'completed'],
      default: 'pending'
    },
    drivingLicense: { type: String, default: '' },
    licenseDoc: { type: String, default: '' },
    pickupLocation: { type: String, default: '' },
    pickupNotes: { type: String, default: '' },
    totalCost: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
