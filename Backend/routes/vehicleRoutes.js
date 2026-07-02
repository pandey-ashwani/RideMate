import express from 'express';
import {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  createVehicleReview
} from '../controllers/vehicleController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router
  .route('/')
  .get(getVehicles)
  .post(protect, authorize('owner', 'admin'), createVehicle);

router
  .route('/:id')
  .get(getVehicleById)
  .put(protect, authorize('owner', 'admin'), updateVehicle)
  .delete(protect, authorize('owner', 'admin'), deleteVehicle);

router.post('/:id/reviews', protect, authorize('customer'), createVehicleReview);

export default router;
