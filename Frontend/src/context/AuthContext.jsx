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

  const register = async (name, email, password, role, company = '', phone = '') => {
    try {
      const body = { name, email, password, role };
      if (role === 'owner') {
        body.company = company;
        body.phone = phone;
      }

      const resData = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(body)
      });

      setUser(resData);
      localStorage.setItem('ridemate_user', JSON.stringify(resData));
      localStorage.setItem('ridemate_token', resData.token);
      return { success: true, user: resData };
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
  const verifyOwner = async (ownerId) => {
    try {
      await apiRequest(`/admin/hosts/${ownerId}/verify`, {
        method: 'PUT'
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
