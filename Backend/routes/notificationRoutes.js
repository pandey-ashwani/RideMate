import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.put('/read-all', protect, markAllNotificationsAsRead);
router.put('/:id/read', protect, markNotificationAsRead);

export default router;
