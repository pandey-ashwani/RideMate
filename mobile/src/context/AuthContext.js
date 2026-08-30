import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginApi, registerApi, sendOtpApi, verifyOtpApi, resendOtpApi, forgotPasswordApi, resetPasswordApi, getProfileApi, updateProfileApi } from '../api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load session from AsyncStorage on app launch
  useEffect(() => {
    const loadSession = async () => {
      try {
        const token = await AsyncStorage.getItem('ridemate_token');
        const savedUser = await AsyncStorage.getItem('ridemate_user');

        if (token && savedUser) {
          setUser(JSON.parse(savedUser));
          // Verify & refresh profile silently
          try {
            const freshProfile = await getProfileApi();
            const updatedUser = { ...freshProfile, token };
            setUser(updatedUser);
            await AsyncStorage.setItem('ridemate_user', JSON.stringify(updatedUser));
          } catch (profileErr) {
            console.log('Session verification warning:', profileErr.message);
          }
        }
      } catch (err) {
        console.error('Failed to load stored session:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  const login = async (email, password, role) => {
    try {
      const res = await loginApi(email, password, role);
      const userObj = res.user ? { ...res.user, token: res.token } : res;
      
      setUser(userObj);
      await AsyncStorage.setItem('ridemate_user', JSON.stringify(userObj));
      if (res.token) {
        await AsyncStorage.setItem('ridemate_token', res.token);
      }
      return { success: true, user: userObj };
    } catch (err) {
      return { success: false, message: err.message || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const res = await registerApi(userData);
      const userObj = res.user ? { ...res.user, token: res.token } : res;
      
      if (res.requiresOtp) {
        return { success: true, requiresOtp: true, user: userObj };
      }

      setUser(userObj);
      await AsyncStorage.setItem('ridemate_user', JSON.stringify(userObj));
      if (res.token) {
        await AsyncStorage.setItem('ridemate_token', res.token);
      }
      return { success: true, user: userObj };
    } catch (err) {
      return { success: false, message: err.message || 'Registration failed' };
    }
  };

  const sendOtp = async (email, purpose = 'verification') => {
    try {
      const res = await sendOtpApi(email, purpose);
      return { success: true, message: res.message, devOtp: res.devOtp || res.otp };
    } catch (err) {
      return { success: false, message: err.message || 'Failed to send OTP' };
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const res = await verifyOtpApi(email, otp);
      console.log('VERIFY OTP RESPONSE:', res);

      const userObj = res.user
        ? {
            ...res.user,
            emailVerified: true,
            phoneVerified: true,
            token: res.token || (res.user && res.user.token)
          }
        : {
            ...res,
            emailVerified: true,
            phoneVerified: true
          };

      const tokenToSave = res.token || userObj.token;

      if (tokenToSave) {
        await AsyncStorage.setItem('ridemate_token', tokenToSave);
        console.log('AUTH TOKEN SAVED:', tokenToSave);
      }

      await AsyncStorage.setItem('ridemate_user', JSON.stringify(userObj));
      console.log('AUTH USER SAVED:', userObj);

      setUser(userObj);
      console.log('AUTH STATE UPDATED:', userObj);
      console.log('USER ROLE:', userObj?.role);
      console.log('NAVIGATING/ROUTING TO:', userObj?.role === 'owner' ? 'OwnerTabs' : 'MainTabs');

      return { success: true, user: userObj };
    } catch (err) {
      console.error('OTP verification error:', err);
      return { success: false, message: err.message || 'OTP verification failed' };
    }
  };

  const resendOtp = async (email) => {
    try {
      const res = await resendOtpApi(email);
      return { success: true, message: res.message, devOtp: res.devOtp || res.otp };
    } catch (err) {
      return { success: false, message: err.message || 'Failed to resend OTP' };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const res = await forgotPasswordApi(email);
      console.log('[FORGOT PASSWORD] API RESPONSE:', res);
      return {
        success: true,
        message: res.message,
        developmentOtp: res.developmentOtp || res.devOtp || res.otp,
        devOtp: res.devOtp || res.developmentOtp || res.otp,
        otp: res.otp
      };
    } catch (err) {
      console.error('[FORGOT PASSWORD] API ERROR:', err);
      return { success: false, message: err.message || 'Failed to send password reset code' };
    }
  };

  const verifyResetOtp = async (email, otp) => {
    try {
      const res = await verifyResetOtpApi(email, otp);
      return { success: true, message: res.message };
    } catch (err) {
      return { success: false, message: err.message || 'Invalid or expired verification code.' };
    }
  };

  const resetPassword = async (email, otp, newPassword) => {
    try {
      const res = await resetPasswordApi(email, otp, newPassword);
      return { success: true, message: res.message };
    } catch (err) {
      return { success: false, message: err.message || 'Failed to reset password' };
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem('ridemate_user');
      await AsyncStorage.removeItem('ridemate_token');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await updateProfileApi(profileData);
      const token = await AsyncStorage.getItem('ridemate_token');
      const newUserObj = { ...updatedUser, token };
      setUser(newUserObj);
      await AsyncStorage.setItem('ridemate_user', JSON.stringify(newUserObj));
      return { success: true, user: newUserObj };
    } catch (err) {
      return { success: false, message: err.message || 'Update profile failed' };
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
        verifyResetOtp,
        resetPassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
