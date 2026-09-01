import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

import dotenv from 'dotenv';
dotenv.config();



import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import connectDB from './config/db.js';

// Middlewares
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import documentRoutes from './routes/documentRoutes.js';

// File Upload endpoint for vehicles & protected DL documents
import { upload, protectedUpload, validateFileMagicBytes, processUploadedFile } from './middleware/uploadMiddleware.js';

// Load Config


// Production Provider Credentials Validation Warnings
if (process.env.NODE_ENV === 'production') {
  const smsProvider = process.env.SMS_PROVIDER || 'console';
  const emailProvider = process.env.EMAIL_PROVIDER || 'console';

  if (smsProvider === 'console') {
    console.warn('⚠️ PRODUCTION NOTICE: SMS_PROVIDER is set to console. OTPs will log to server stdout.');
  }
  if (emailProvider === 'console') {
    console.warn('⚠️ PRODUCTION NOTICE: EMAIL_PROVIDER is set to console. Email OTPs will log to server stdout unless EMAIL_HOST SMTP is configured.');
  }
}

// Connect to MongoDB
connectDB();

const app = express();

// Request logging (morgan)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Security & Production CORS Configurations
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Platform', 'X-Requested-With', 'Accept']
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Set initial commission rate (10%)
app.set('commissionRate', 10);

// Static uploads directory serving with protected folder access shield
const __dirname = path.resolve();
app.use('/uploads', (req, res, next) => {
  // Block any direct web access to protected folder files
  if (req.path.startsWith('/protected')) {
    return res.status(403).json({ message: 'Access denied: Protected document endpoint access required' });
  }
  next();
}, express.static(path.join(__dirname, '/uploads')));

// Serve frontend static production build if available
const frontendDistPath = path.join(__dirname, 'Frontend', 'dist');
const parentFrontendDistPath = path.join(__dirname, '..', 'Frontend', 'dist');

const distPath = fs.existsSync(frontendDistPath)
  ? frontendDistPath
  : fs.existsSync(parentFrontendDistPath)
  ? parentFrontendDistPath
  : null;

if (distPath) {
  app.use(express.static(distPath));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'RideMate', service: 'RideMate Backend API' });
});

// Routes mount
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/documents', documentRoutes);

// File Upload handler endpoints
// Standard public upload (vehicles, avatars)
app.post('/api/upload', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('No image file provided');
    }

    const folder = req.query.folder || 'general';
    const result = await processUploadedFile(req.file, folder);

    res.json({
      message: 'Image uploaded successfully',
      path: result.path,
      url: result.url,
      public_id: result.public_id || null
    });
  } catch (error) {
    next(error);
  }
});

// Protected DL document upload handler
app.post('/api/upload/protected', protectedUpload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('No document file provided');
    }

    // Validate magic bytes server-side
    const isValidMagic = validateFileMagicBytes(req.file.path);
    if (!isValidMagic) {
      res.status(400);
      throw new Error('Invalid or corrupted document file signature. Executable or unsupported file types are strictly prohibited.');
    }

    const result = await processUploadedFile(req.file, 'documents');

    res.json({
      message: 'Document uploaded securely',
      path: result.path,
      url: result.url,
      public_id: result.public_id || null
    });
  } catch (error) {
    next(error);
  }
});

// SPA catch-all fallback handler for sub-routes on page reloads/desktop mode
if (distPath) {
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

// Error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`RideMate Backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
