import express from 'express';
import {
  getAllUsers,
  toggleUserBlock,
  getPendingOwners,
  verifyOwner,
  getAllBookings,
  getDashboardStats,
  updateCommissionConfig,
  getAllListings,
  approveListing
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Guard all admin routes with protect + authorize('admin')
router.use(protect, authorize('admin'));

router.get('/users', getAllUsers);
router.put('/users/:id/block', toggleUserBlock);

router.get('/pending-owners', getPendingOwners);
router.get('/pending-hosts', getPendingOwners);
router.put('/owners/:id/verify', verifyOwner);
router.put('/hosts/:id/verify', verifyOwner);

router.get('/listings', getAllListings);
router.put('/listings/:id/approve', approveListing);

router.get('/bookings', getAllBookings);
router.get('/stats', getDashboardStats);
router.put('/payments/commission', updateCommissionConfig);

export default router;
