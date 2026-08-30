import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import TouchButton from '../../components/Common/TouchButton';
import CustomInput from '../../components/Common/CustomInput';
import colors from '../../theme/colors';

export const OTPVerificationScreen = ({ route, navigation }) => {
  const { verifyOtp, resendOtp } = useAuth();

  const email = route.params?.email || '';
  const phone = route.params?.phone || '';
  const identifier = email || phone;
  const initialDevOtp = route.params?.devOtp || route.params?.otp || '';

  const [otp, setOtp] = useState('');
  const [devOtpCode, setDevOtpCode] = useState(initialDevOtp);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [otpTimer, setOtpTimer] = useState(600);
  const [resendCooldown, setResendCooldown] = useState(60);

  // OTP expiry timer
  useEffect(() => {
    if (otpTimer <= 0) return;

    const timer = setInterval(() => {
      setOtpTimer((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [otpTimer]);

  // Resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatTimer = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(
      remainingSeconds
    ).padStart(2, '0')}`;
  };

  const handleVerify = async () => {
    setError('');
    setSuccessMsg('');

    if (!otp.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Please enter a valid 6-digit numerical code.');
      return;
    }

    if (otpTimer <= 0) {
      setError('This OTP has expired. Please request a new code.');
      return;
    }

    try {
      setLoading(true);

      const response = await verifyOtp(identifier, otp.trim());

      if (!response?.success) {
        setError(
          response?.message ||
            'Invalid verification code. Please try again.'
        );
        return;
      }

      // OTP successfully verified
      setSuccessMsg('Email verified successfully! Entering dashboard...');

      // AuthContext.verifyOtp() has saved the verified user & token and updated state.
      // AppNavigator automatically transitions to the correct dashboard (Customer/Owner) based on auth state.
    } catch (error) {
      console.log('OTP verification error:', error);

      setError(
        error?.response?.data?.message ||
          error?.message ||
          'Unable to verify OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;

    setError('');
    setSuccessMsg('');

    try {
      setResending(true);

      const response = await resendOtp(identifier);

      if (response?.success) {
        setOtp('');
        setOtpTimer(600);
        setResendCooldown(60);
        if (response?.devOtp || response?.otp) {
          setDevOtpCode(String(response.devOtp || response.otp));
        }

        setSuccessMsg(
          'A new verification code has been sent to your email.'
        );
      } else {
        setError(
          response?.message || 'Unable to resend verification code.'
        );
      }
    } catch (error) {
      console.log('OTP resend error:', error);

      setError(
        error?.response?.data?.message ||
          error?.message ||
          'Unable to resend OTP. Please try again.'
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <View style={styles.card}>

            {/* Icon */}
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>✉</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>Verify Your Email</Text>

            <Text style={styles.subtitle}>
              We sent a 6-digit verification code to
            </Text>

            <Text style={styles.email}>{identifier}</Text>

            {/* Timer */}
            <View style={styles.timerContainer}>
              <Text style={styles.timerLabel}>Code expires in</Text>
              <Text style={styles.timer}>
                {formatTimer(otpTimer)}
              </Text>
            </View>

            {/* Error */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Success */}
            {successMsg ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{successMsg}</Text>
              </View>
            ) : null}

            {devOtpCode ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setOtp(String(devOtpCode))}
                style={{ backgroundColor: '#FEF3C7', padding: 12, borderRadius: 8, marginVertical: 8, alignItems: 'center', width: '100%' }}
              >
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#92400E' }}>
                  OTP : {devOtpCode}
                </Text>
              </TouchableOpacity>
            ) : null}

            {/* OTP Input */}
            <CustomInput
              label="Verification Code"
              value={otp}
              onChangeText={(text) => {
                setError('');
                setOtp(text.replace(/[^0-9]/g, '').slice(0, 6));
              }}
              placeholder="Enter 6-digit code"
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />

            {/* Verify */}
            <TouchButton
              title={loading ? 'Verifying...' : 'Verify Email'}
              onPress={handleVerify}
              loading={loading}
              disabled={loading || otp.length !== 6}
              style={styles.verifyButton}
            />

            {/* Resend */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>
                Didn't receive the code?
              </Text>

              <TouchableOpacity
                onPress={handleResend}
                disabled={resendCooldown > 0 || resending}
              >
                <Text
                  style={[
                    styles.resendButton,
                    (resendCooldown > 0 || resending) &&
                      styles.resendDisabled,
                  ]}
                >
                  {resending
                    ? 'Sending...'
                    : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Change email */}
            <TouchableOpacity
              style={styles.changeButton}
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('Login');
                }
              }}
            >
              <Text style={styles.changeText}>Change email address</Text>
            </TouchableOpacity>

          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
    backgroundColor: colors.dark,
  },

  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.infoBg,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.infoBorder,
  },

  icon: {
    fontSize: 30,
    color: colors.textPrimary,
  },

  title: {
    fontSize: 25,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  email: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 20,
  },

  timerContainer: {
    alignSelf: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginBottom: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  timerLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  timer: {
    fontSize: 18,
    color: colors.tabActive,
    fontWeight: '900',
    marginTop: 2,
  },

  errorBox: {
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },

  errorText: {
    color: colors.errorText,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  successBox: {
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.successBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },

  successText: {
    color: colors.successText,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  verifyButton: {
    marginTop: 10,
  },

  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },

  resendText: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  resendButton: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.tabActive,
    marginLeft: 5,
  },

  resendDisabled: {
    color: colors.disabledText,
  },

  changeButton: {
    alignSelf: 'center',
    marginTop: 18,
  },

  changeText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
});

export default OTPVerificationScreen;