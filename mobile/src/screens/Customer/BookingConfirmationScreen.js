import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { confirmBookingDetailsApi, uploadProtectedDocumentApi } from '../../api/bookings';
import HeaderBar from '../../components/Common/HeaderBar';
import TouchButton from '../../components/Common/TouchButton';
import CustomInput from '../../components/Common/CustomInput';
import colors from '../../theme/colors';

export const BookingConfirmationScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const booking = route.params?.booking || {};

  const [dlNumber, setDlNumber] = useState(user?.drivingLicense || '');
  const [docPath, setDocPath] = useState(user?.licenseDoc || '/uploads/protected/dl-sample.jpg');
  const [pickupLocation, setPickupLocation] = useState(booking.vehicleId?.location || '');
  const [pickupNotes, setPickupNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmitDetails = async () => {
    if (!dlNumber || !pickupLocation) {
      setError('Driving License Number and Pickup Location are required to confirm booking.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await confirmBookingDetailsApi(booking._id, {
        drivingLicense: dlNumber.trim(),
        licenseDoc: docPath,
        pickupLocation: pickupLocation.trim(),
        pickupNotes: pickupNotes.trim(),
      });

      Alert.alert(
        'Booking Confirmed! ✅',
        'Your driving license & pickup details have been submitted. The owner has been notified.',
        [{ text: 'Great!', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      setError(err.message || 'Failed to submit confirmation details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <HeaderBar title="Confirm Rental Details" showBack onBackPress={() => navigation.goBack()} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          
          <View style={styles.noticeBox}>
            <Text style={styles.noticeIcon}>🎉</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.noticeTitle}>Owner Accepted Your Request!</Text>
              <Text style={styles.noticeSub}>Provide your driving license & pickup spot below to confirm your booking.</Text>
            </View>
          </View>

          <View style={styles.card}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            <CustomInput
              label="Driving License Number"
              value={dlNumber}
              onChangeText={setDlNumber}
              placeholder="e.g. DL-1420110012345"
              autoCapitalize="characters"
            />

            <CustomInput
              label="Pickup Location"
              value={pickupLocation}
              onChangeText={setPickupLocation}
              placeholder="e.g. Dehradun Airport / Depot"
            />

            <CustomInput
              label="Pickup Notes (Optional)"
              value={pickupNotes}
              onChangeText={setPickupNotes}
              placeholder="e.g. Will arrive around 10:00 AM at main gate"
              multiline
              numberOfLines={3}
            />

            <View style={styles.docShieldBox}>
              <Text style={styles.shieldIcon}>🛡️</Text>
              <Text style={styles.shieldText}>
                Your Driving License is protected by server-side authorization and will only be shared with your verified vehicle host.
              </Text>
            </View>

            <TouchButton
              title={loading ? 'Confirming...' : 'Submit & Confirm Booking'}
              onPress={handleSubmitDetails}
              loading={loading}
              variant="primary"
              style={{ marginTop: 12 }}
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 16,
  },
  noticeBox: {
    backgroundColor: colors.successBg,
    borderColor: colors.successBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  noticeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.successText,
  },
  noticeSub: {
    fontSize: 12,
    color: colors.successText,
    marginTop: 2,
    lineHeight: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
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
  docShieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    padding: 12,
    borderRadius: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shieldIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  shieldText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    flex: 1,
    lineHeight: 15,
  },
});

export default BookingConfirmationScreen;
