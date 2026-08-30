import { apiFetch } from './client';

export const loginApi = async (email, password, role) => {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, role }),
  });
};

export const registerApi = async (userData) => {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const sendOtpApi = async (email, purpose = 'verification') => {
  return apiFetch('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email, purpose }),
  });
};

export const verifyOtpApi = async (identifier, otp) => {
  return apiFetch('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email: identifier, phone: identifier, identifier, otp }),
  });
};

export const resendOtpApi = async (identifier) => {
  return apiFetch('/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email: identifier, phone: identifier, identifier }),
  });
};

export const forgotPasswordApi = async (email) => {
  return apiFetch('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

export const verifyResetOtpApi = async (email, otp) => {
  return apiFetch('/auth/verify-reset-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
};

export const resetPasswordApi = async (email, otp, newPassword) => {
  return apiFetch('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, otp, newPassword }),
  });
};

export const getProfileApi = async () => {
  return apiFetch('/auth/profile', {
    method: 'GET',
  });
};

export const updateProfileApi = async (profileData) => {
  return apiFetch('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
};
