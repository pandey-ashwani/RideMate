import { apiFetch } from './client';

export const getVehiclesApi = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.type && params.type !== 'all') query.append('type', params.type);
  if (params.location) query.append('location', params.location);
  if (params.search) query.append('search', params.search);
  if (params.brand) query.append('brand', params.brand);
  if (params.ownerId) query.append('ownerId', params.ownerId);
  query.append('pageSize', params.pageSize || '100');

  const queryString = query.toString() ? `?${query.toString()}` : '';
  const res = await apiFetch(`/vehicles${queryString}`, { method: 'GET' });
  return Array.isArray(res) ? res : (res.vehicles || []);
};

export const getVehicleByIdApi = async (id) => {
  return apiFetch(`/vehicles/${id}`, { method: 'GET' });
};

export const createVehicleApi = async (vehicleData) => {
  return apiFetch('/vehicles', {
    method: 'POST',
    body: JSON.stringify(vehicleData),
  });
};

export const updateVehicleApi = async (id, vehicleData) => {
  return apiFetch(`/vehicles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(vehicleData),
  });
};

export const deleteVehicleApi = async (id) => {
  return apiFetch(`/vehicles/${id}`, { method: 'DELETE' });
};

export const createReviewApi = async (id, rating, text) => {
  return apiFetch(`/vehicles/${id}/reviews`, {
    method: 'POST',
    body: JSON.stringify({ rating, text }),
  });
};

export const uploadVehicleImageApi = async (fileUri) => {
  // Extract & sanitize filename safely for Android content URIs & document pickers
  let rawName = (fileUri || '').split('/').pop() || 'photo.jpg';
  try {
    rawName = decodeURIComponent(rawName.split('?')[0]);
  } catch (e) {
    rawName = 'photo.jpg';
  }

  let ext = 'jpg';
  const match = /\.(\w+)$/.exec(rawName);
  if (match && match[1]) {
    const foundExt = match[1].toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'pdf', 'heic', 'heif'].includes(foundExt)) {
      ext = foundExt;
    }
  }

  const cleanFilename = `upload_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'pdf' ? 'application/pdf' : 'image/jpeg';

  const formData = new FormData();
  formData.append('image', {
    uri: fileUri,
    name: cleanFilename,
    type: mimeType,
  });

  return apiFetch('/upload', {
    method: 'POST',
    body: formData,
  });
};
