import { apiFetch } from './client';

export const createBookingApi = async (vehicleId, pickupDate, dropoffDate) => {
  return apiFetch('/bookings', {
    method: 'POST',
    body: JSON.stringify({ vehicleId, pickupDate, dropoffDate }),
  });
};

export const getMyBookingsApi = async () => {
  return apiFetch('/bookings/my-bookings', { method: 'GET' });
};

export const confirmBookingDetailsApi = async (id, details) => {
  return apiFetch(`/bookings/${id}/confirm`, {
    method: 'PUT',
    body: JSON.stringify(details),
  });
};

export const cancelBookingApi = async (id) => {
  return apiFetch(`/bookings/${id}/cancel`, { method: 'PUT' });
};

export const getOwnerRequestsApi = async () => {
  return apiFetch('/bookings/owner-requests', { method: 'GET' });
};

export const updateBookingStatusApi = async (id, status) => {
  return apiFetch(`/bookings/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
};

export const uploadProtectedDocumentApi = async (fileObj) => {
  const formData = new FormData();
  formData.append('image', fileObj);

  return apiFetch('/upload/protected', {
    method: 'POST',
    body: formData,
  });
};
