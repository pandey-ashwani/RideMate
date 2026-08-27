import { Platform } from 'react-native';
import Constants from 'expo-constants';

const PRIMARY_WIFI_IP = '100.67.228.171';
const HOTSPOT_IP = '192.168.137.1';

export const getApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Automatically extract Expo Go / Metro host IP (Works on Physical Android & iOS phones)
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost || Constants.manifest?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:5000/api`;
    }
  }

  // Standalone APK on physical Android device
  if (Platform.OS === 'android') {
    return `http://${PRIMARY_WIFI_IP}:5000/api`;
  }

  // Fallback for iOS Simulator / Web / Local
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

export const resolveImageUrl = (path) => {
  if (!path) return 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500';
  if (path.startsWith('http')) return path;

  const baseHost = getApiBaseUrl().replace('/api', '');
  return `${baseHost}${path.startsWith('/') ? '' : '/'}${path}`;
};
