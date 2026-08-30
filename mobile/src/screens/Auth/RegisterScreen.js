import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import TouchButton from '../../components/Common/TouchButton';
import CustomInput from '../../components/Common/CustomInput';
import colors from '../../theme/colors';

export const RegisterScreen = ({ route, navigation }) => {
  const { register } = useAuth();
  const initialRole = route.params?.role || 'customer';

  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError('Name, Email, and Password are required.');
      return;
    }

    if (role === 'owner' && (!phone || !company)) {
      setError('Company name and Mobile number are required for vehicle owners.');
      return;
    }

    setError('');
    setLoading(true);

    const payload = {
      name: name.trim(),
      email: email.trim(),
      password,
      role,
    };

    if (phone) {
      payload.phone = phone.trim();
    }

    if (role === 'owner') {
      payload.company = company.trim();
    }

    const res = await register(payload);
    setLoading(false);

    if (res.success) {
      if (res.requiresOtp) {
        navigation.navigate('OTPVerification', {
          email: res.user?.email || email.trim(),
          phone: res.user?.phone || phone.trim(),
          devOtp: res.user?.devOtp,
          role,
        });
      } else if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } else {
      setError(res.message || 'Registration failed.');
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
            <Text style={styles.brandTitle}>Create Account</Text>
            <Text style={styles.brandSub}>Join RideMate to rent rides or list your fleet</Text>
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
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            <CustomInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Rahul Sharma"
            />

            <CustomInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="e.g. rahul@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <CustomInput
              label={role === 'owner' ? "Mobile Number" : "Mobile Number (Optional)"}
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. 9876543210"
              keyboardType="phone-pad"
            />

            {role === 'owner' && (
              <CustomInput
                label="Company / Rental Fleet Name"
                value={company}
                onChangeText={setCompany}
                placeholder="e.g. Sharma Eco Rentals"
              />
            )}

            <CustomInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a strong password"
              secureTextEntry
            />

            <TouchButton
              title={loading ? 'Creating Account...' : 'Register & Send Email OTP'}
              onPress={handleRegister}
              loading={loading}
              style={{ marginTop: 8 }}
            />

            <View style={styles.footerLinkRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </View>
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
    width: 64,
    height: 64,
    borderRadius: 14,
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textLight,
    marginBottom: 4,
  },
  brandSub: {
    fontSize: 13,
    color: colors.textMuted,
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

export default RegisterScreen;
