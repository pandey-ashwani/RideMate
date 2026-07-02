import express from 'express';
import {
  createBooking,
  cancelBooking,
  getMyBookings,
  getOwnerRequests,
  updateBookingStatus
} from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('customer'), createBooking);
router.put('/:id/cancel', protect, authorize('customer'), cancelBooking);
router.get('/my-bookings', protect, authorize('customer'), getMyBookings);

router.get('/owner-requests', protect, authorize('owner'), getOwnerRequests);
router.put('/:id/status', protect, authorize('owner'), updateBookingStatus);

export default router;
