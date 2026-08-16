import path from 'path';
import fs from 'fs';
import Booking from '../models/Booking.js';
import User from '../models/User.js';

// @desc    View protected Driving License document for a booking
// @route   GET /api/documents/dl/:bookingId
// @access  Private (Authorized Customer, Assigned Owner after acceptance, or Admin)
export const getProtectedDLDocument = async (req, res, next) => {
  const { bookingId } = req.params;

  try {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      res.status(404);
      throw new Error('Booking record not found');
    }

    const currentUserId = req.user._id.toString();
    const isCustomerOwnerOfBooking = booking.customerId.toString() === currentUserId;
    const isVehicleOwnerOfBooking = booking.ownerId.toString() === currentUserId;
    const isAdmin = req.user.role === 'admin';

    // Strict Authorization Rules:
    // 1. Customer who booked the ride can view their own document.
    // 2. Owner of the booked vehicle can view ONLY IF booking is 'owner_accepted', 'confirmed', or 'completed'.
    // 3. Admin can view for platform compliance audits.
    const isOwnerAuthorized = isVehicleOwnerOfBooking && ['owner_accepted', 'confirmed', 'completed'].includes(booking.status);

    if (!isCustomerOwnerOfBooking && !isOwnerAuthorized && !isAdmin) {
      res.status(403);
      throw new Error('Unauthorized: You do not have permission to view this Driving License document');
    }

    // Determine target document path from booking or customer profile
    let docPath = booking.licenseDoc;
    if (!docPath) {
      const customerUser = await User.findById(booking.customerId);
      docPath = customerUser ? customerUser.licenseDoc : '';
    }

    if (!docPath) {
      res.status(404);
      throw new Error('No Driving License document uploaded for this booking');
    }

    // Sanitize and resolve file path strictly on server-side
    // Strip leading slashes to resolve relative to process root
    const cleanRelativePath = docPath.replace(/^[/\\]+/, '');
    const absolutePath = path.resolve(process.cwd(), cleanRelativePath);

    // Prevent path traversal attack
    const uploadsBase = path.resolve(process.cwd(), 'uploads');
    if (!absolutePath.startsWith(uploadsBase)) {
      res.status(403);
      throw new Error('Access denied: Invalid document path');
    }

    if (!fs.existsSync(absolutePath)) {
      res.status(404);
      throw new Error('Document file not found on server storage');
    }

    // Serve protected document
    res.sendFile(absolutePath);
  } catch (error) {
    next(error);
  }
};

export default getProtectedDLDocument;
