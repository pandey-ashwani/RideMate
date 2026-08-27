import { apiFetch } from './client';

export const getNotificationsApi = async () => {
  return apiFetch('/notifications', { method: 'GET' });
};

export const markNotificationAsReadApi = async (id) => {
  return apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
};

export const markAllNotificationsAsReadApi = async () => {
  return apiFetch('/notifications/read-all', { method: 'PUT' });
};
