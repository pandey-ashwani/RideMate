import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Production RideMate backend hosted on Render
const PRODUCTION_API_URL = 'https://ridemate-cp4a.onrender.com/api';

export const getApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  return PRODUCTION_API_URL;
};

export const API_BASE_URL = getApiBaseUrl();

export const resolveImageUrl = (path) => {
  // Default fallback image
  if (!path) {
    return 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500';
  }

  // If path is already a full http/https URL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Convert relative upload paths like /uploads/image.jpg
  // into https://ridemate-cp4a.onrender.com/uploads/image.jpg
  const baseHost = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${baseHost}${path.startsWith('/') ? '' : '/'}${path}`;
};