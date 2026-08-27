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

export const OTPVerificationScreen = ({ route, navigation }) => {
  const { verifyOtp, resendOtp } = useAuth();

  const email = route.params?.email || '';
  const phone = route.params?.phone || '';
  const identifier = email || phone;

  const [otp, setOtp] = useState('');
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
    setError('Please enter the verification code.');
    return;
  }

  if (!/^\d{6}$/.test(otp.trim())) {
    setError('Please enter the 6-digit verification code.');
    return;
  }

  if (otpTimer <= 0) {
    setError('This OTP has expired. Please request a new code.');
    return;
  }

  try {
    setLoading(true);

    const response = await verifyOtp(identifier, otp.trim());

    console.log('OTP verification result:', response);

    if (!response?.success) {
      setError(
        response?.message ||
          'Invalid verification code. Please try again.'
      );
      return;
    }

    // OTP successfully verified
    setSuccessMsg('Email verified successfully!');

    /*
     * AuthContext has already:
     * 1. Saved the verified user
     * 2. Saved the JWT token
     * 3. Called setUser()
     *
     * Therefore AppNavigator will automatically switch
     * from OTPVerification to the Customer/Owner navigation.
     */

    // Small delay so user can see the success message
    setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: response?.user?.role === 'owner'
              ? 'OwnerTabs'
              : 'MainTabs',
          },
        ],
      });
    }, 500);

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
              onPress={() => navigation.goBack()}
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
    backgroundColor: '#0F172A',
  },

  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
  },

  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E0F2FE',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },

  icon: {
    fontSize: 30,
    color: '#0284C7',
  },

  title: {
    fontSize: 25,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },

  email: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0284C7',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 20,
  },

  timerContainer: {
    alignSelf: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginBottom: 18,
    alignItems: 'center',
  },

  timerLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },

  timer: {
    fontSize: 18,
    color: '#0284C7',
    fontWeight: '900',
    marginTop: 2,
  },

  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },

  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  successBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },

  successText: {
    color: '#059669',
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
    color: '#64748B',
  },

  resendButton: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0284C7',
    marginLeft: 5,
  },

  resendDisabled: {
    color: '#94A3B8',
  },

  changeButton: {
    alignSelf: 'center',
    marginTop: 18,
  },

  changeText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default OTPVerificationScreen;