import express from 'express';
import {
  getAllUsers,
  toggleUserBlock,
  getPendingHosts,
  verifyHost,
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

router.get('/pending-hosts', getPendingHosts);
router.get('/pending-owners', getPendingHosts);
router.put('/hosts/:id/verify', verifyHost);
router.put('/owners/:id/verify', verifyHost);

router.get('/listings', getAllListings);
router.put('/listings/:id/approve', approveListing);

router.get('/bookings', getAllBookings);
router.get('/stats', getDashboardStats);
router.put('/payments/commission', updateCommissionConfig);

export default router;
