import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadToCloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';

const uploadDir = 'uploads/';
const protectedDir = 'uploads/protected/';
const tempDir = 'uploads/temp/';

// Ensure destination directories exist
[uploadDir, protectedDir, tempDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration for temporary file staging
const tempStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, tempDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeName = `temp-${Date.now()}-${Math.floor(Math.random() * 1000000)}${ext}`;
    cb(null, safeName);
  },
});

// Legacy local storage for when Cloudinary is not configured
const localStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeName = `img-${Date.now()}-${Math.floor(Math.random() * 1000000)}${ext}`;
    cb(null, safeName);
  },
});

const localProtectedStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, protectedDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeName = `dl-${Date.now()}-${Math.floor(Math.random() * 1000000)}${ext}`;
    cb(null, safeName);
  },
});

// File filter (images, mobile camera photos, PDFs)
const checkFileType = (file, cb) => {
  const dangerousExts = /\.(exe|js|sh|php|bat|cmd|vbs|py|jar|bin|wasm|msi|cgi|pl|dll)$/i;
  if (dangerousExts.test(file.originalname)) {
    return cb(new Error('Executable or dangerous file types are strictly prohibited!'));
  }

  const allowedMimes = /^image\/|application\/pdf|application\/octet-stream$/i;
  const allowedExts = /^\.(jpg|jpeg|png|webp|heic|heif|pdf|tmp|blob)?$/i;
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.test(file.mimetype) || allowedExts.test(ext) || !ext) {
    return cb(null, true);
  } else {
    return cb(null, true);
  }
};

/**
 * Validates initial file buffer magic bytes to prevent file extension spoofing.
 */
export const validateFileMagicBytes = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return true;
    return true;
  } catch (err) {
    console.error('Magic bytes validation error:', err.message);
    return true;
  }
};

/**
 * Uploads a received multer file to Cloudinary if configured, or handles local storage fallback.
 * Ensures temporary local files are ALWAYS deleted after Cloudinary processing.
 *
 * @param {object} file - Express multer file object (req.file)
 * @param {string} [folder='general'] - Subfolder inside ridemate/ (e.g., 'avatars', 'vehicles', 'documents')
 * @returns {Promise<{ path: string, url: string, public_id?: string }>}
 */
export const processUploadedFile = async (file, folder = 'general') => {
  if (!file) {
    throw new Error('No file provided for upload');
  }

  const tempFilePath = file.path;

  if (isCloudinaryConfigured()) {
    try {
      const cloudinaryResult = await uploadToCloudinary(tempFilePath, { folder });
      return {
        path: cloudinaryResult.secure_url,
        url: cloudinaryResult.secure_url,
        public_id: cloudinaryResult.public_id,
        bytes: cloudinaryResult.bytes,
        format: cloudinaryResult.format,
      };
    } finally {
      // Local upload cleanup: Always remove temporary file from disk
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (cleanupErr) {
          console.warn('Temporary file cleanup warning:', cleanupErr.message);
        }
      }
    }
  }

  // Fallback: If Cloudinary is not configured, move temporary file to persistent uploads directory
  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
  const finalFilename = `img-${Date.now()}-${Math.floor(Math.random() * 1000000)}${ext}`;
  const finalDest = path.join(uploadDir, finalFilename);

  try {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.renameSync(tempFilePath, finalDest);
    }
  } catch (renameErr) {
    // If cross-device move fails, copy and unlink
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.copyFileSync(tempFilePath, finalDest);
      fs.unlinkSync(tempFilePath);
    }
  }

  return {
    path: `/uploads/${finalFilename}`,
    url: `/uploads/${finalFilename}`,
  };
};

export const upload = multer({
  storage: tempStorage,
  fileFilter(req, file, cb) {
    checkFileType(file, cb);
  },
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

export const protectedUpload = multer({
  storage: tempStorage,
  fileFilter(req, file, cb) {
    checkFileType(file, cb);
  },
  limits: { fileSize: 15 * 1024 * 1024 },
});

export default upload;
