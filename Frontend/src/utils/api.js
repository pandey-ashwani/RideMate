export const API_URL = import.meta.env.VITE_API_URL || 'https://ridemate-cp4a.onrender.com/api';

export const getDefaultVehicleImage = (type = '', name = '') => {
  const t = (type || '').toLowerCase();
  const n = (name || '').toLowerCase();
  if (t === 'car' || n.includes('car') || n.includes('suv') || n.includes('sedan')) {
    return 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80';
  }
  if (t === 'scooter' || n.includes('activa') || n.includes('jupiter') || n.includes('scoot')) {
    return 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('hunter') || n.includes('bullet') || n.includes('enfield')) {
    return 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('pulsar') || n.includes('apache') || n.includes('fz')) {
    return 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80';
};

export const resolveImageUrl = (path, type = '', name = '') => {
  if (!path) {
    return getDefaultVehicleImage(type, name);
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const baseHost = API_URL.replace(/\/api\/?$/, '');
  return `${baseHost}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('ridemate_token');
  const headers = {
    ...options.headers
  };

  // Do not set Content-Type header if sending FormData (Multipart file upload)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Something went wrong');
  }

  return response.json();
};

export default apiRequest;
