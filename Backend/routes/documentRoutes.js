import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getProtectedDLDocument } from '../controllers/documentController.js';

const router = express.Router();

// Protected DL document route (Requires authenticated user with strict authorization checks)
router.get('/dl/:bookingId', protect, getProtectedDLDocument);

export default router;
