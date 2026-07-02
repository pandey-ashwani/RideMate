import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';
import Payment from '../models/Payment.js';

// @desc    Create a new booking request
// @route   POST /api/bookings
// @access  Private (Customer)
export const createBooking = async (req, res, next) => {
  const { vehicleId, pickupDate, dropoffDate } = req.body;

  try {
    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      res.status(404);
      throw new Error('Vehicle not found');
    }

    if (!vehicle.availability) {
      res.status(400);
      throw new Error('Vehicle is currently rented out or unavailable');
    }

    if (vehicle.status !== 'approved') {
      res.status(400);
      throw new Error('This vehicle listing is awaiting administrative approval');
    }

    const start = new Date(pickupDate);
    const end = new Date(dropoffDate);
    
    if (start >= end) {
      res.status(400);
      throw new Error('Return date must be after pickup date');
    }

    const timeDiff = end - start;
    const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) || 1;
    const totalCost = days * vehicle.pricePerDay;

    const booking = new Booking({
      vehicleId: vehicle._id,
      customerId: req.user._id,
      ownerId: vehicle.ownerId,
      pickupDate: start,
      dropoffDate: end,
      totalCost,
      status: 'pending' // Initial status
    });

    const createdBooking = await booking.save();
    res.status(201).json(createdBooking);
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private (Customer)
export const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      res.status(404);
      throw new Error('Booking not found');
    }

    // Security: Only customer who booked can cancel
    if (booking.customerId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to cancel this booking');
    }

    if (booking.status === 'completed' || booking.status === 'rejected') {
      res.status(400);
      throw new Error('Cannot cancel a ride that is already completed or rejected');
    }

    booking.status = 'rejected'; // Mark as rejected/cancelled
    await booking.save();

    // Release vehicle availability
    const vehicle = await Vehicle.findById(booking.vehicleId);
    if (vehicle) {
      vehicle.availability = true;
      await vehicle.save();
    }

    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer booking history
// @route   GET /api/bookings/my-bookings
// @access  Private (Customer)
export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ customerId: req.user._id })
      .populate('vehicleId', 'name brand type image pricePerDay location')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

// @desc    Get owner's booking requests
// @route   GET /api/bookings/owner-requests
// @access  Private (Owner)
export const getOwnerRequests = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ ownerId: req.user._id })
      .populate('vehicleId', 'name brand type image pricePerDay location')
      .populate('customerId', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking request status (Approve/Reject/Complete)
// @route   PUT /api/bookings/:id/status
// @access  Private (Owner)
export const updateBookingStatus = async (req, res, next) => {
  const { status } = req.body; // approved, rejected, completed

  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      res.status(404);
      throw new Error('Booking not found');
    }

    // Security: Only owner of vehicle can update status
    if (booking.ownerId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to respond to this booking request');
    }

    if (booking.status === 'completed' || booking.status === 'rejected') {
      res.status(400);
      throw new Error('Cannot modify booking status after completion or rejection');
    }

    booking.status = status;
    const updatedBooking = await booking.save();

    const vehicle = await Vehicle.findById(booking.vehicleId);

    if (status === 'approved') {
      // Lock vehicle availability
      if (vehicle) {
        vehicle.availability = false;
        await vehicle.save();
      }

      // Generate simulated Payment ledger
      const commissionRate = Number(req.app.get('commissionRate')) || 10;
      const commissionAmt = Number((booking.totalCost * (commissionRate / 100)).toFixed(2));
      const netAmt = Number((booking.totalCost - commissionAmt).toFixed(2));

      await Payment.create({
        bookingId: booking._id,
        customerId: booking.customerId,
        ownerId: booking.ownerId,
        amount: booking.totalCost,
        commission: commissionAmt,
        netPayout: netAmt,
        status: 'completed',
        transactionId: `TX-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`
      });
    }

    if (status === 'completed' || status === 'rejected') {
      // Release vehicle availability back to public
      if (vehicle) {
        vehicle.availability = true;
        await vehicle.save();
      }
    }

    res.json({ message: `Booking status updated to ${status}`, booking: updatedBooking });
  } catch (error) {
    next(error);
  }
};
