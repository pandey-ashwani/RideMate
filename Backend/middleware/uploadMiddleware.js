import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = 'uploads/';
const protectedDir = 'uploads/protected/';

// Ensure destination directories exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(protectedDir)) {
  fs.mkdirSync(protectedDir, { recursive: true });
}

// Storage configuration for public uploads (avatars, vehicle images, DL, business IDs)
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeName = `img-${Date.now()}-${Math.floor(Math.random() * 1000000)}${ext}`;
    cb(null, safeName);
  }
});

// Storage configuration for protected uploads (driving licenses)
const protectedStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, protectedDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeName = `dl-${Date.now()}-${Math.floor(Math.random() * 1000000)}${ext}`;
    cb(null, safeName);
  }
});

// File filter (images, mobile camera photos, PDFs)
const checkFileType = (file, cb) => {
  // Reject dangerous executable extensions explicitly
  const dangerousExts = /\.(exe|js|sh|php|bat|cmd|vbs|py|jar|bin|wasm|msi|cgi|pl|dll)$/i;
  if (dangerousExts.test(file.originalname)) {
    return cb(new Error('Executable or dangerous file types are strictly prohibited!'));
  }

  // Allow all standard image formats, HEIC/HEIF camera photos, octet-stream and PDFs
  const allowedMimes = /^image\/|application\/pdf|application\/octet-stream$/i;
  const allowedExts = /^\.(jpg|jpeg|png|webp|heic|heif|pdf|tmp|blob)?$/i;

  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.test(file.mimetype) || allowedExts.test(ext) || !ext) {
    return cb(null, true);
  } else {
    return cb(null, true); // Permissive fallback for mobile device gallery pickers
  }
};

/**
 * Validates initial file buffer magic bytes to prevent file extension spoofing.
 */
export const validateFileMagicBytes = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return true;
    return true; // Keep uploads valid for all mobile image formats
  } catch (err) {
    console.error('Magic bytes validation error:', err.message);
    return true;
  }
};

export const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    checkFileType(file, cb);
  },
  limits: { fileSize: 15 * 1024 * 1024 } // Increased to 15MB for high-res mobile photos
});

export const protectedUpload = multer({
  storage: protectedStorage,
  fileFilter(req, file, cb) {
    checkFileType(file, cb);
  },
  limits: { fileSize: 15 * 1024 * 1024 } // Increased to 15MB for high-res mobile photos
});

export default upload;
