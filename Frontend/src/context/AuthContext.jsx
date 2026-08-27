import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('ridemate_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(true);

  // Sync session on load
  useEffect(() => {
    const checkUserSession = async () => {
      const token = localStorage.getItem('ridemate_token');
      if (token) {
        try {
          const profile = await apiRequest('/auth/profile');
          const userData = { ...profile, token };
          setUser(userData);
          localStorage.setItem('ridemate_user', JSON.stringify(userData));
        } catch (err) {
          console.error('Session verification failed, logging out:', err);
          logout();
        }
      }
      setLoading(false);
    };

    checkUserSession();
  }, []);

  const login = async (email, password, role) => {
    try {
      const resData = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role })
      });

      setUser(resData);
      localStorage.setItem('ridemate_user', JSON.stringify(resData));
      localStorage.setItem('ridemate_token', resData.token);
      return { success: true, user: resData };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ridemate_user');
    localStorage.removeItem('ridemate_token');
  };

  const register = async (name, email, password, role, company = '', phone = '', avatar = '') => {
    try {
      const body = { name, email, password, role };
      if (avatar) body.avatar = avatar;
      if (role === 'owner') {
        body.company = company;
        body.phone = phone;
      }

      const resData = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(body)
      });

      if (resData.requiresOtp) {
        return { success: true, requiresOtp: true, user: resData };
      }

      setUser(resData);
      localStorage.setItem('ridemate_user', JSON.stringify(resData));
      localStorage.setItem('ridemate_token', resData.token);
      return { success: true, user: resData };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const sendOtp = async (email, purpose = 'verification') => {
    try {
      const resData = await apiRequest('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email, purpose })
      });
      return { success: true, message: resData.message, devOtp: resData.devOtp };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const resData = await apiRequest('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp })
      });

      if (resData.token) {
        setUser(resData);
        localStorage.setItem('ridemate_user', JSON.stringify(resData));
        localStorage.setItem('ridemate_token', resData.token);
      }
      return { success: true, user: resData, message: resData.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const resendOtp = async (email) => {
    try {
      const resData = await apiRequest('/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      return { success: true, message: resData.message, devOtp: resData.devOtp };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const resData = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      return { success: true, message: resData.message, devOtp: resData.devOtp };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const resetPassword = async (email, otp, newPassword) => {
    try {
      const resData = await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, otp, newPassword })
      });
      return { success: true, message: resData.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });

      setUser(updatedUser);
      localStorage.setItem('ridemate_user', JSON.stringify(updatedUser));
      if (updatedUser.token) {
        localStorage.setItem('ridemate_token', updatedUser.token);
      }
      return { success: true, user: updatedUser };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  // Admin controls
  const verifyOwner = async (ownerId, status = 'approved', reason = '') => {
    try {
      await apiRequest(`/admin/owners/${ownerId}/verify`, {
        method: 'PUT',
        body: JSON.stringify({ status, reason })
      });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const toggleUserStatus = async (userId) => {
    try {
      const res = await apiRequest(`/admin/users/${userId}/block`, {
        method: 'PUT'
      });
      return { success: true, user: res.user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        register,
        sendOtp,
        verifyOtp,
        resendOtp,
        forgotPassword,
        resetPassword,
        updateProfile,
        verifyOwner,
        toggleUserStatus
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
