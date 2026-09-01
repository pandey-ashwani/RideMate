import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

/**
 * Checks whether all required Cloudinary environment variables are configured.
 */
export const isCloudinaryConfigured = () => {
  return Boolean(
    cloudName &&
    apiKey &&
    apiSecret &&
    cloudName !== 'your_cloud_name' &&
    apiKey !== 'your_api_key' &&
    apiSecret !== 'your_api_secret'
  );
};

// Initialize Cloudinary if credentials are present
if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  console.log('✅ Cloudinary initialized for persistent cloud storage');
} else {
  console.warn('⚠️ Notice: Cloudinary credentials not fully configured in environment. Using local file storage fallback.');
}

/**
 * Upload a local file to Cloudinary.
 * @param {string} filePath - Local absolute or relative path to file.
 * @param {object} [options] - Additional Cloudinary upload options.
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
export const uploadToCloudinary = async (filePath, options = {}) => {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not configured.');
  }

  const defaultFolder = options.folder ? `ridemate/${options.folder}` : 'ridemate';

  const uploadOptions = {
    folder: defaultFolder,
    resource_type: 'auto',
    ...options,
  };

  const result = await cloudinary.uploader.upload(filePath, uploadOptions);
  return {
    secure_url: result.secure_url,
    public_id: result.public_id,
    format: result.format,
    resource_type: result.resource_type,
    bytes: result.bytes,
  };
};

/**
 * Delete an asset from Cloudinary by its public ID.
 * @param {string} publicId - The Cloudinary public ID.
 * @returns {Promise<object>}
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId || !isCloudinaryConfigured()) {
    return { result: 'skipped' };
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (err) {
    console.error(`Failed to delete old image (${publicId}) from Cloudinary:`, err.message);
    return { result: 'error', error: err.message };
  }
};

/**
 * Helper to extract Cloudinary public ID from a Cloudinary URL if stored as full URL.
 * e.g. https://res.cloudinary.com/demo/image/upload/v123456/ridemate/avatars/sample.jpg -> ridemate/avatars/sample
 */
export const extractPublicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
    return null;
  }

  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    
    // Remove version tag like v123456789/ if present
    const pathAfterUpload = parts[1].replace(/^v\d+\//, '');
    // Remove file extension
    const lastDotIndex = pathAfterUpload.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      return pathAfterUpload.substring(0, lastDotIndex);
    }
    return pathAfterUpload;
  } catch (err) {
    return null;
  }
};

export default cloudinary;
