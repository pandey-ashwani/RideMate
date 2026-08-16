import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
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
import { upload, protectedUpload, validateFileMagicBytes } from './middleware/uploadMiddleware.js';

// Load Config
dotenv.config();

// Production Provider Credentials Validation
if (process.env.NODE_ENV === 'production') {
  const smsProvider = process.env.SMS_PROVIDER;
  const emailProvider = process.env.EMAIL_PROVIDER;

  if (smsProvider === 'console' || !smsProvider) {
    throw new Error('FATAL PRODUCTION CONFIGURATION ERROR: SMS_PROVIDER=console is forbidden in production.');
  }
  if (smsProvider === 'msg91' && (!process.env.MSG91_AUTH_KEY || !process.env.MSG91_SENDER_ID)) {
    throw new Error('FATAL PRODUCTION CONFIGURATION ERROR: MSG91_AUTH_KEY and MSG91_SENDER_ID are required for MSG91 SMS provider.');
  }
  if (smsProvider === 'twilio' && (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER)) {
    throw new Error('FATAL PRODUCTION CONFIGURATION ERROR: Twilio SID, Auth Token, and Phone Number are required for Twilio SMS provider.');
  }
  if (smsProvider === 'exotel' && (!process.env.EXOTEL_ACCOUNT_SID || !process.env.EXOTEL_API_KEY || !process.env.EXOTEL_API_TOKEN)) {
    throw new Error('FATAL PRODUCTION CONFIGURATION ERROR: Exotel Account SID, API Key, and API Token are required for Exotel SMS provider.');
  }

  if (emailProvider === 'console' || !emailProvider) {
    throw new Error('FATAL PRODUCTION CONFIGURATION ERROR: EMAIL_PROVIDER=console is forbidden in production.');
  }
  if (emailProvider === 'resend' && !process.env.RESEND_API_KEY) {
    throw new Error('FATAL PRODUCTION CONFIGURATION ERROR: RESEND_API_KEY is required for Resend email provider.');
  }
  if (emailProvider === 'brevo' && !process.env.BREVO_API_KEY) {
    throw new Error('FATAL PRODUCTION CONFIGURATION ERROR: BREVO_API_KEY is required for Brevo email provider.');
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
  origin: process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL 
    : true,
  credentials: true
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

// Routes mount
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/documents', documentRoutes);

// File Upload handler endpoints
// Standard public upload (vehicles, avatars)
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

// Protected DL document upload handler
app.post('/api/upload/protected', protectedUpload.single('image'), (req, res) => {
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

  res.json({
    message: 'Document uploaded securely',
    path: `/uploads/protected/${req.file.filename}`
  });
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

app.listen(PORT, () => {
  console.log(`RideMate Backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
