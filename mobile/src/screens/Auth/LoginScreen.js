import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import TouchButton from '../../components/Common/TouchButton';
import CustomInput from '../../components/Common/CustomInput';
import colors from '../../theme/colors';

export const LoginScreen = ({ navigation }) => {
  const { login, forgotPassword, verifyResetOtp, resetPassword, resendOtp } = useAuth();
  const [role, setRole] = useState('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot password multi-step state: 'email' (Step 1) | 'otp' (Step 2) | 'password' (Step 3) | 'success' (Step 4)
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [devOtpCode, setDevOtpCode] = useState('');
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
      setError('Please enter your email and password.');
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

  // STEP 1: Submit Email to receive OTP
  const handleSendResetCode = async () => {
    if (!forgotEmail || !forgotEmail.includes('@')) {
      setError('Please enter a valid registered email address.');
      return;
    }

    setError('');
    setForgotSuccess('');
    setForgotLoading(true);

    const res = await forgotPassword(forgotEmail.trim());
    setForgotLoading(false);

    if (res.success) {
      setForgotStep('otp');
      if (res.devOtp || res.otp) {
        setDevOtpCode(String(res.devOtp || res.otp));
      }
      setForgotSuccess(res.message || 'Verification code generated.');
      setResendCooldown(60);
    } else {
      setError(res.message || 'Failed to send password reset code.');
    }
  };

  // STEP 2: Verify 6-digit OTP
  const handleVerifyResetOtp = async () => {
    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setError('');
    setForgotSuccess('');
    setForgotLoading(true);

    const res = await verifyResetOtp(forgotEmail.trim(), forgotOtp.trim());
    setForgotLoading(false);

    if (res.success) {
      setForgotStep('password');
      setForgotSuccess('Code verified! Please create your new password.');
    } else {
      setError(res.message || 'Invalid verification code. Please check and try again.');
    }
  };

  // STEP 3: Reset password & save
  const handleResetPasswordSubmit = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setError('');
    setForgotSuccess('');
    setForgotLoading(true);

    const res = await resetPassword(forgotEmail.trim(), forgotOtp.trim(), newPassword);
    setForgotLoading(false);

    if (res.success) {
      setForgotStep('success');
      setEmail(forgotEmail);
      setPassword('');
      setError('');
    } else {
      setError(res.message || 'Failed to reset password.');
    }
  };

  // Resend OTP
  const handleResendResetCode = async () => {
    if (resendCooldown > 0 || forgotLoading) return;
    setError('');
    setForgotSuccess('');
    setForgotLoading(true);

    const res = await resendOtp(forgotEmail.trim());
    setForgotLoading(false);

    if (res.success) {
      if (res.devOtp || res.otp) setDevOtpCode(String(res.devOtp || res.otp));
      setForgotSuccess('A new verification code has been generated.');
      setResendCooldown(60);
    } else {
      setError(res.message || 'Failed to resend code.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          
          <View style={styles.brandHeader}>
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandTitle}>RideMate</Text>
            <Text style={styles.brandSub}>Vehicle Rentals Simplified</Text>
          </View>

          {/* Role selector Tabs */}
          {!isForgotMode && (
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
          )}

          <View style={styles.formCard}>
            {isForgotMode ? (
              <>
                <Text style={styles.formTitle}>Reset Password</Text>
                
                {forgotStep === 'email' && (
                  <Text style={styles.forgotSubText}>
                    Step 1 of 3: Enter your registered email address to receive a 6-digit verification code.
                  </Text>
                )}
                {forgotStep === 'otp' && (
                  <Text style={styles.forgotSubText}>
                    Step 2 of 3: Enter the 6-digit verification code sent to {forgotEmail}.
                  </Text>
                )}
                {forgotStep === 'password' && (
                  <Text style={styles.forgotSubText}>
                    Step 3 of 3: Choose a strong new password for your RideMate account.
                  </Text>
                )}

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

                {/* STEP 1: Enter Email */}
                {forgotStep === 'email' && (
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
                      title={forgotLoading ? 'Sending Code...' : 'Send Verification Code'}
                      onPress={handleSendResetCode}
                      loading={forgotLoading}
                      style={{ marginTop: 8 }}
                    />
                  </>
                )}

                {/* STEP 2: Enter OTP & Show Development OTP clearly */}
                {forgotStep === 'otp' && (
                  <>
                    {devOtpCode ? (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => setForgotOtp(devOtpCode)}
                        style={styles.devOtpContainer}
                      >
                        <Text style={styles.devOtpLabel}>🛠️ DEVELOPMENT OTP (TAP TO AUTO-FILL)</Text>
                        <Text style={styles.devOtpCodeText}>OTP : {devOtpCode}</Text>
                      </TouchableOpacity>
                    ) : null}

                    <CustomInput
                      label="6-Digit Verification Code"
                      value={forgotOtp}
                      onChangeText={(text) => {
                        setError('');
                        setForgotOtp(text.replace(/[^0-9]/g, '').slice(0, 6));
                      }}
                      placeholder="123456"
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                    />

                    <TouchButton
                      title={forgotLoading ? 'Verifying...' : 'Verify Code'}
                      onPress={handleVerifyResetOtp}
                      loading={forgotLoading}
                      disabled={forgotOtp.length !== 6 || forgotLoading}
                      style={{ marginTop: 8 }}
                    />

                    <TouchableOpacity
                      disabled={resendCooldown > 0 || forgotLoading}
                      onPress={handleResendResetCode}
                      style={{ alignSelf: 'center', marginTop: 14 }}
                    >
                      <Text style={[styles.resendLinkText, resendCooldown > 0 && styles.resendDisabled]}>
                        {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : "Didn't receive code? Resend Code"}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* STEP 3: Enter New Password & Confirm Password */}
                {forgotStep === 'password' && (
                  <>
                    <CustomInput
                      label="New Password"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Enter new strong password"
                      secureTextEntry
                    />

                    <CustomInput
                      label="Confirm New Password"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Re-enter your new password"
                      secureTextEntry
                    />

                    <TouchButton
                      title={forgotLoading ? 'Resetting Password...' : 'Reset Password & Save'}
                      onPress={handleResetPasswordSubmit}
                      loading={forgotLoading}
                      style={{ marginTop: 8 }}
                    />
                  </>
                )}

                {/* STEP 4: Success Message & Redirect to Login */}
                {forgotStep === 'success' && (
                  <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                    <Text style={{ fontSize: 40, marginBottom: 8 }}>🎉</Text>
                    <Text style={[styles.formTitle, { textAlign: 'center', marginBottom: 6 }]}>Password Reset Complete!</Text>
                    <Text style={[styles.forgotSubText, { textAlign: 'center', marginBottom: 18 }]}>
                      Your password has been updated successfully. You can now log in with your new password.
                    </Text>
                    <TouchButton
                      title="Return to Login"
                      onPress={() => {
                        setIsForgotMode(false);
                        setForgotStep('email');
                        setForgotSuccess('');
                        setError('');
                      }}
                      style={{ width: '100%' }}
                    />
                  </View>
                )}

                {forgotStep !== 'success' && (
                  <TouchableOpacity
                    style={styles.backToLoginRow}
                    onPress={() => {
                      setIsForgotMode(false);
                      setForgotStep('email');
                      setError('');
                      setForgotSuccess('');
                    }}
                  >
                    <Text style={styles.backToLoginText}>← Back to Login</Text>
                  </TouchableOpacity>
                )}
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
    backgroundColor: colors.dark,
  },
  container: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandLogo: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textLight,
  },
  brandSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  roleTabs: {
    flexDirection: 'row',
    backgroundColor: colors.darkSurface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.darkBorder,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  roleTabActive: {
    backgroundColor: colors.primary,
  },
  roleTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  roleTabTextActive: {
    color: colors.textOnPrimary,
    fontWeight: '800',
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  forgotSubText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: colors.errorBg,
    borderColor: colors.errorBorder,
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    color: colors.errorText,
    fontSize: 12,
    fontWeight: '700',
  },
  successBox: {
    backgroundColor: colors.successBg,
    borderColor: colors.successBorder,
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  successText: {
    color: colors.successText,
    fontSize: 12,
    fontWeight: '700',
  },
  devOtpContainer: {
    backgroundColor: colors.infoBg,
    borderColor: colors.infoBorder,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  devOtpLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.infoText,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  devOtpCodeText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 3,
  },
  forgotBtnRow: {
    alignSelf: 'flex-end',
    marginBottom: 14,
    marginTop: -4,
  },
  forgotBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.tabActive,
  },
  resendLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.tabActive,
  },
  resendDisabled: {
    color: colors.disabledText,
  },
  backToLoginRow: {
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 4,
  },
  backToLoginText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  footerLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  footerText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.tabActive,
  },
});

export default LoginScreen;
