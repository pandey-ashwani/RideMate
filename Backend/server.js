import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Middlewares
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// File Upload endpoint for vehicles
import { protect, authorize } from './middleware/authMiddleware.js';
import { upload } from './middleware/uploadMiddleware.js';

// Load Config
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Request logging (morgan)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Global configurations
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set initial commission rate (10%)
app.set('commissionRate', 10);

// Static uploads directory serving
const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Routes mount
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// File Upload handler endpoint (Supports vehicle images, verification docs, and profile pictures)
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No image file provided');
  }
  res.json({
    message: 'Image uploaded successfully',
    path: `/uploads/${req.file.filename}`
  });
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`RideMate Backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
