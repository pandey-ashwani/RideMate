import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import TouchButton from '../../components/Common/TouchButton';
import CustomInput from '../../components/Common/CustomInput';

export const LoginScreen = ({ navigation }) => {
  const { login, forgotPassword, resetPassword, resendOtp } = useAuth();
  const [role, setRole] = useState('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password States
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState('email'); // 'email' | 'reset'
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  React.useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email address and password.');
      return;
    }

    setError('');
    setLoading(true);

    const res = await login(email.trim(), password, role);
    setLoading(false);

    if (res.success) {
      if (res.user?.role === 'admin') {
        Alert.alert(
          'Web Admin Access Only 🌐',
          'Administrator access is restricted to the Web Admin Portal. Please log in using a web browser on your laptop or computer.',
          [{ text: 'OK' }]
        );
        setError('Admin access is restricted to the website admin portal.');
        return;
      }

      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } else {
      setError(res.message || 'Invalid email or password.');
    }
  };

  const handleSendResetCode = async () => {
    if (!forgotEmail || !forgotEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setForgotSuccess('');
    setForgotLoading(true);

    const res = await forgotPassword(forgotEmail.trim());
    setForgotLoading(false);

    if (res.success) {
      setForgotStep('reset');
      setForgotSuccess(res.message || 'Reset code sent to your email.');
    } else {
      setError(res.message || 'Failed to send password reset code.');
    }
  };

  const handleResetPasswordSubmit = async () => {
    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setError('');
    setForgotSuccess('');
    setForgotLoading(true);

    const res = await resetPassword(forgotEmail.trim(), forgotOtp.trim(), newPassword);
    setForgotLoading(false);

    if (res.success) {
      Alert.alert('Success 🔑', 'Password reset successfully! Please log in with your new password.', [{ text: 'OK' }]);
      setEmail(forgotEmail);
      setPassword('');
      setIsForgotMode(false);
      setError('');
    } else {
      setError(res.message || 'Failed to reset password.');
    }
  };

  const handleResendResetCode = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setForgotSuccess('');
    setForgotLoading(true);

    const res = await resendOtp(forgotEmail.trim());
    setForgotLoading(false);

    if (res.success) {
      setForgotSuccess(res.message || 'A new reset code has been sent to your email.');
      setResendCooldown(60);
    } else {
      setError(res.message || 'Failed to resend reset code.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          
          <View style={styles.brandHeader}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>RM</Text>
            </View>
            <Text style={styles.brandTitle}>RideMate</Text>
            <Text style={styles.brandSub}>Vehicle Rentals Simplified</Text>
          </View>

          {/* Role selector Tabs */}
          <View style={styles.roleTabs}>
            <TouchableOpacity
              onPress={() => setRole('customer')}
              style={[styles.roleTab, role === 'customer' && styles.roleTabActive]}
            >
              <Text style={[styles.roleTabText, role === 'customer' && styles.roleTabTextActive]}>
                👤 Customer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setRole('owner')}
              style={[styles.roleTab, role === 'owner' && styles.roleTabActive]}
            >
              <Text style={[styles.roleTabText, role === 'owner' && styles.roleTabTextActive]}>
                🔑 Vehicle Owner
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formCard}>
            {isForgotMode ? (
              <>
                <Text style={styles.formTitle}>Reset Password</Text>
                <Text style={styles.forgotSubText}>
                  {forgotStep === 'email'
                    ? 'Enter your registered email address to receive a 6-digit verification code.'
                    : `Enter the 6-digit code sent to ${forgotEmail} and your new password.`}
                </Text>

                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                  </View>
                ) : null}

                {forgotSuccess ? (
                  <View style={styles.successBox}>
                    <Text style={styles.successText}>✅ {forgotSuccess}</Text>
                  </View>
                ) : null}

                {forgotStep === 'email' ? (
                  <>
                    <CustomInput
                      label="Email Address"
                      value={forgotEmail}
                      onChangeText={setForgotEmail}
                      placeholder="e.g. john@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />

                    <TouchButton
                      title={forgotLoading ? 'Sending Code...' : 'Send Reset Code'}
                      onPress={handleSendResetCode}
                      loading={forgotLoading}
                      style={{ marginTop: 8 }}
                    />
                  </>
                ) : (
                  <>
                    <CustomInput
                      label="6-Digit Reset Code"
                      value={forgotOtp}
                      onChangeText={setForgotOtp}
                      placeholder="123456"
                      keyboardType="number-pad"
                      maxLength={6}
                    />

                    <CustomInput
                      label="New Password"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Enter new strong password"
                      secureTextEntry
                    />

                    <TouchButton
                      title={forgotLoading ? 'Resetting Password...' : 'Reset Password & Save'}
                      onPress={handleResetPasswordSubmit}
                      loading={forgotLoading}
                      style={{ marginTop: 8 }}
                    />

                    <TouchableOpacity
                      disabled={resendCooldown > 0 || forgotLoading}
                      onPress={handleResendResetCode}
                      style={{ alignSelf: 'center', marginTop: 12 }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: resendCooldown > 0 ? '#94A3B8' : '#0284C7' }}>
                        {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : "Didn't receive code? Resend Code"}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity
                  style={styles.backToLoginRow}
                  onPress={() => {
                    setIsForgotMode(false);
                    setError('');
                  }}
                >
                  <Text style={styles.backToLoginText}>← Back to Login</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.formTitle}>
                  {role === 'owner' ? 'Owner Login' : 'Customer Login'}
                </Text>

                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                  </View>
                ) : null}

                <CustomInput
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="e.g. john@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <CustomInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry
                />

                <TouchableOpacity
                  style={styles.forgotBtnRow}
                  onPress={() => {
                    setIsForgotMode(true);
                    setForgotStep('email');
                    setForgotEmail(email);
                    setError('');
                    setForgotSuccess('');
                  }}
                >
                  <Text style={styles.forgotBtnText}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchButton
                  title={loading ? 'Signing In...' : 'Sign In'}
                  onPress={handleLogin}
                  loading={loading}
                  style={{ marginTop: 8 }}
                />

                <View style={styles.footerLinkRow}>
                  <Text style={styles.footerText}>Don't have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Register', { role })}>
                    <Text style={styles.linkText}>Register Now</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    elevation: 4,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  logoText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  brandSub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  roleTabs: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  roleTabActive: {
    backgroundColor: '#F59E0B',
  },
  roleTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  roleTabTextActive: {
    color: '#0F172A',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  forgotSubText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  successBox: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  successText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  devOtpBox: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  devOtpBadge: {
    fontSize: 10,
    fontWeight: '900',
    color: '#B45309',
  },
  devOtpCode: {
    fontSize: 22,
    fontWeight: '900',
    color: '#78350F',
    letterSpacing: 4,
    marginVertical: 2,
  },
  devOtpHint: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '700',
  },
  forgotBtnRow: {
    alignSelf: 'flex-end',
    marginBottom: 14,
    marginTop: -4,
  },
  forgotBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
  },
  backToLoginRow: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 4,
  },
  backToLoginText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
  footerLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 13,
    color: '#64748B',
  },
  linkText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
  },
});

export default LoginScreen;
