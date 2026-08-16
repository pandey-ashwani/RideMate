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

// Storage configuration for public uploads (avatars, vehicle images)
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
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
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `dl-${Date.now()}-${Math.floor(Math.random() * 1000000)}${ext}`;
    cb(null, safeName);
  }
});

// File filter (images & PDFs)
const checkFileType = (file, cb) => {
  const allowedExts = /^\.(jpg|jpeg|png|webp|pdf)$/i;
  const allowedMimes = /^image\/(jpeg|jpg|png|webp)|application\/pdf$/i;

  const extname = allowedExts.test(path.extname(file.originalname));
  const mimetype = allowedMimes.test(file.mimetype);

  // Reject executable or dangerous extension names explicitly
  const dangerousExts = /\.(exe|js|sh|php|bat|cmd|vbs|py|jar|bin|wasm|msi|cgi|pl|dll)$/i;
  if (dangerousExts.test(file.originalname)) {
    return cb(new Error('Executable or dangerous file types are strictly prohibited!'));
  }

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (jpg, jpeg, png, webp) and PDF documents are allowed!'));
  }
};

/**
 * Validates initial file buffer magic bytes to prevent file extension spoofing.
 */
export const validateFileMagicBytes = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return false;
    const buffer = Buffer.alloc(8);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);

    // JPEG: FF D8 FF
    const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    // PNG: 89 50 4E 47
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    // WEBP: RIFF (52 49 46 46)
    const isWebp = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
    // PDF: %PDF (25 50 44 46)
    const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;

    if (isJpeg || isPng || isWebp || isPdf) {
      return true;
    }

    // Invalid magic bytes - delete file safely
    fs.unlinkSync(filePath);
    return false;
  } catch (err) {
    console.error('Magic bytes validation error:', err.message);
    return false;
  }
};

export const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    checkFileType(file, cb);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export const protectedUpload = multer({
  storage: protectedStorage,
  fileFilter(req, file, cb) {
    checkFileType(file, cb);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export default upload;
