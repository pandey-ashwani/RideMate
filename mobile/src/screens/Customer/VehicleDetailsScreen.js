import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getVehicleByIdApi } from '../../api/vehicles';
import { createBookingApi } from '../../api/bookings';
import { resolveImageUrl } from '../../utils/config';
import HeaderBar from '../../components/Common/HeaderBar';
import TouchButton from '../../components/Common/TouchButton';
import CustomInput from '../../components/Common/CustomInput';
import colors from '../../theme/colors';

export const VehicleDetailsScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const { vehicleId } = route.params;

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  const getLocalDateISO = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseLocalDate = (isoStr) => {
    if (!isoStr) return new Date();
    const parts = isoStr.split('-').map(Number);
    if (parts.length < 3 || isNaN(parts[0])) return new Date();
    return new Date(parts[0], parts[1] - 1, parts[2]);
  };

  const todayStr = getLocalDateISO(new Date());

  const addDaysToStr = (startStr, days) => {
    try {
      const start = parseLocalDate(startStr);
      start.setDate(start.getDate() + days);
      return getLocalDateISO(start);
    } catch {
      return startStr;
    }
  };

  const tomorrowStr = addDaysToStr(todayStr, 1);

  const [pickupDate, setPickupDate] = useState(todayStr);
  const [dropoffDate, setDropoffDate] = useState(tomorrowStr);
  const [pickerModal, setPickerModal] = useState(null); // 'pickup' | 'return' | null

  const formatDateFriendly = (dateStr) => {
    try {
      const d = parseLocalDate(dateStr);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const generateUpcomingDates = (startDateStr, numDays = 30) => {
    const dates = [];
    try {
      const base = parseLocalDate(startDateStr);
      const todayDate = parseLocalDate(todayStr);
      const start = base < todayDate ? todayDate : base;

      for (let i = 0; i < numDays; i++) {
        const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
        const iso = getLocalDateISO(d);
        const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

        dates.push({ iso, label });
      }
    } catch (e) {
      console.error(e);
    }
    return dates;
  };

  const calculateDays = (startStr, endStr) => {
    try {
      const start = parseLocalDate(startStr);
      const end = parseLocalDate(endStr);
      const diffTime = end - start;
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 1;
    } catch {
      return 1;
    }
  };

  const handlePickupChange = (val) => {
    setPickupDate(val);
    if (val && val.length === 10) {
      if (val < todayStr) {
        Alert.alert('Invalid Pickup Date ⚠️', 'Pickup date cannot be in the past.');
        setPickupDate(todayStr);
        setDropoffDate(addDaysToStr(todayStr, 1));
        return;
      }
      if (dropoffDate <= val) {
        setDropoffDate(addDaysToStr(val, 1));
      }
    }
  };

  const handleDropoffChange = (val) => {
    setDropoffDate(val);
    if (val && val.length === 10) {
      if (val <= pickupDate) {
        Alert.alert('Invalid Return Date ⚠️', 'Return date must be at least 1 day after pickup date.');
        setDropoffDate(addDaysToStr(pickupDate, 1));
      }
    }
  };

  const dailyRate = Number(vehicle?.pricePerDay || 0);
  const rentalDays = calculateDays(pickupDate, dropoffDate);
  const totalCost = dailyRate * rentalDays;

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = await getVehicleByIdApi(vehicleId);
        const targetVehicle = data?.vehicle || data;
        setVehicle(targetVehicle);
      } catch (err) {
        Alert.alert('Error', err.message || 'Failed to load vehicle details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [vehicleId]);

  const handleRequestBooking = async () => {
    if (!user) {
      Alert.alert(
        'Sign In Required 🔑',
        'Please sign in or create an account to request a vehicle booking.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Auth') },
        ]
      );
      return;
    }

    if (!vehicle) return;
    if (!vehicle.availability) {
      Alert.alert('Unavailable', 'This vehicle is currently rented out or unavailable.');
      return;
    }

    setBookingLoading(true);
    try {
      await createBookingApi(vehicle._id, pickupDate, dropoffDate);
      Alert.alert(
        'Request Sent! 🥳',
        `Your booking request for ${vehicle.name} has been sent to the owner. You can track status under "My Bookings".`,
        [{ text: 'View My Bookings', onPress: () => navigation.navigate('MainTabs', { screen: 'BookingsTab' }) }]
      );
    } catch (err) {
      Alert.alert('Booking Error', err.message || 'Failed to create booking request');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading || !vehicle) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <HeaderBar title="Vehicle Details" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading vehicle details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const imageUrl = resolveImageUrl(vehicle.image);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <HeaderBar title={vehicle.name} showBack onBackPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.container}>
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />

        <View style={styles.contentCard}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.brand}>
                {vehicle.ownerId?.company ? `🏢 ${vehicle.ownerId.company}` : vehicle.brand || 'RideMate Fleet'}
              </Text>
              <Text style={styles.title}>{vehicle.name}</Text>
            </View>
            <View style={[styles.statusBadge, vehicle.availability ? styles.availBg : styles.rentedBg]}>
              <Text style={[styles.statusText, vehicle.availability ? styles.availText : styles.rentedText]}>
                {vehicle.availability ? 'Available' : 'Rented'}
              </Text>
            </View>
          </View>

          <Text style={styles.location}>📍 Pickup Location: {vehicle.location || 'Local Depot'}</Text>

          {/* Pricing Box */}
          <View style={styles.priceBox}>
            <View>
              <Text style={styles.priceLabel}>Daily Rental Fee</Text>
              <Text style={styles.priceValue}>₹{vehicle.pricePerDay}<Text style={styles.perDay}> / day</Text></Text>
            </View>
            <View style={styles.typeTag}>
              <Text style={styles.typeTagText}>{vehicle.type?.toUpperCase()}</Text>
            </View>
          </View>

          {/* Dates Selector */}
          <Text style={styles.sectionHeader}>📅 Select Rental Dates</Text>

          <View style={styles.dateSelectorRow}>
            {/* Pickup Date Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPickerModal('pickup')}
              style={styles.dateSelectorBtn}
            >
              <Text style={styles.fieldLabel}>Pickup Date</Text>
              <Text style={styles.dateSelectorValue}>🗓️ {formatDateFriendly(pickupDate)}</Text>
              <Text style={styles.tapChangeHint}>Tap to choose date ▾</Text>
            </TouchableOpacity>

            {/* Return Date Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPickerModal('return')}
              style={styles.dateSelectorBtn}
            >
              <Text style={styles.fieldLabel}>Return Date</Text>
              <Text style={styles.dateSelectorValue}>🏁 {formatDateFriendly(dropoffDate)}</Text>
              <Text style={styles.tapChangeHint}>Tap to choose date ▾</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Duration Buttons */}
          <Text style={styles.quickLabel}>Quick Duration Select:</Text>
          <View style={styles.durationChipsRow}>
            {[
              { label: '1 Day', days: 1 },
              { label: '2 Days', days: 2 },
              { label: '3 Days', days: 3 },
              { label: '1 Week', days: 7 },
            ].map(opt => (
              <TouchableOpacity
                key={opt.label}
                onPress={() => setDropoffDate(addDaysToStr(pickupDate, opt.days))}
                style={[
                  styles.durationChip,
                  rentalDays === opt.days && styles.durationChipActive
                ]}
              >
                <Text style={[styles.durationText, rentalDays === opt.days && styles.durationTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cost Summary Breakdown Box */}
          <View style={styles.costSummaryBox}>
            <View style={styles.costRow}>
              <Text style={styles.costRowLabel}>Rental Duration</Text>
              <Text style={styles.costRowValue}>{rentalDays} {rentalDays === 1 ? 'Day' : 'Days'}</Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costRowLabel}>Rate per Day</Text>
              <Text style={styles.costRowValue}>₹{vehicle.pricePerDay || 0}</Text>
            </View>
            <View style={styles.costTotalRow}>
              <Text style={styles.costTotalLabel}>Total Estimated Price</Text>
              <Text style={styles.costTotalValue}>₹{totalCost}</Text>
            </View>
          </View>

          {/* Owner Info */}
          {vehicle.ownerId && typeof vehicle.ownerId === 'object' && (
            <View style={styles.ownerCard}>
              <Text style={styles.ownerHeader}>Vehicle Host / Owner</Text>
              <Text style={styles.ownerName}>{vehicle.ownerId.name || 'Verified Owner'}</Text>
              {vehicle.ownerId.company ? <Text style={styles.ownerCompany}>🏢 {vehicle.ownerId.company}</Text> : null}
            </View>
          )}

          {/* Booking CTA Button */}
          {user && vehicle?.ownerId && String(typeof vehicle.ownerId === 'object' ? vehicle.ownerId._id : vehicle.ownerId) === String(user._id) && (
            <TouchButton
              title="✏️ Edit Vehicle Listing"
              onPress={() => navigation.navigate('AddEditVehicle', { vehicle })}
              variant="outline"
              style={{ marginBottom: 12 }}
            />
          )}

          <TouchButton
            title={bookingLoading ? 'Submitting Request...' : vehicle.availability ? 'Request Rental Booking' : 'Currently Rented Out'}
            onPress={handleRequestBooking}
            disabled={!vehicle.availability || bookingLoading}
            loading={bookingLoading}
            style={styles.ctaButton}
          />
        </View>
      </ScrollView>

      {/* Interactive Visual Date Selector Modal */}
      <Modal
        visible={Boolean(pickerModal)}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPickerModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {pickerModal === 'pickup' ? '🗓️ Choose Pickup Date' : '🏁 Choose Return Date'}
              </Text>
              <TouchableOpacity onPress={() => setPickerModal(null)} style={styles.closeBtnBox}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              {pickerModal === 'pickup'
                ? 'Select the date you will collect the vehicle'
                : 'Select the date you will return the vehicle'}
            </Text>

            <ScrollView style={styles.datesList} showsVerticalScrollIndicator={false}>
              {(pickerModal === 'pickup'
                ? generateUpcomingDates(todayStr, 30)
                : generateUpcomingDates(addDaysToStr(pickupDate, 1), 30)
              ).map((item) => {
                const isSelected = pickerModal === 'pickup' ? pickupDate === item.iso : dropoffDate === item.iso;
                return (
                  <TouchableOpacity
                    key={item.iso}
                    onPress={() => {
                      if (pickerModal === 'pickup') {
                        setPickupDate(item.iso);
                        if (dropoffDate <= item.iso) {
                          setDropoffDate(addDaysToStr(item.iso, 1));
                        }
                      } else {
                        setDropoffDate(item.iso);
                      }
                      setPickerModal(null);
                    }}
                    style={[styles.dateOption, isSelected && styles.dateOptionActive]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.dateOptionBadge, isSelected && styles.dateOptionActiveText]}>
                        {item.label}
                      </Text>
                    </View>
                    {isSelected ? <Text style={styles.checkMark}>✓ Selected</Text> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

/*
================================
PREVIOUS BLUE THEME
PRESERVED FOR FUTURE RESTORATION
================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  container: {
    paddingBottom: 30,
  },
  image: {
    width: '100%',
    height: 240,
    backgroundColor: '#CBD5E1',
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    padding: 20,
    elevation: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  brand: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.tabActive,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  availBg: { backgroundColor: colors.successBg },
  rentedBg: { backgroundColor: colors.errorBg },
  statusText: { fontSize: 11, fontWeight: '800' },
  availText: { color: colors.successText, fontSize: 11, fontWeight: '800' },
  rentedText: { color: colors.errorText, fontSize: 11, fontWeight: '800' },
  location: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 16,
  },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceMuted,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priceLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
    marginTop: 2,
  },
  perDay: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeTag: {
    backgroundColor: colors.infoBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.infoBorder,
  },
  typeTagText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.tabActive,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  datesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceMuted,
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
  },
  dateField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  dateArrow: {
    fontSize: 16,
    color: colors.textMuted,
    marginHorizontal: 8,
  },
  dateInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  durationChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  durationChip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  durationChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  durationTextActive: {
    color: colors.textOnPrimary,
    fontWeight: '800',
  },
  costSummaryBox: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  costRowLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  costRowValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  costTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 4,
  },
  costTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  costTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.tabActive,
  },
  dateSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  dateSelectorBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.primaryDark,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 4,
  },
  dateSelectorValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    marginVertical: 3,
  },
  tapChangeHint: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.tabActive,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  closeBtnBox: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  modalSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  datesList: {
    marginBottom: 10,
  },
  dateOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  dateOptionBadge: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  dateOptionFull: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dateOptionActiveText: {
    color: colors.textOnPrimary,
    fontWeight: '800',
  },
  checkMark: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textOnPrimary,
  },
  ownerCard: {
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 24,
  },
  ownerHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E40AF',
    textTransform: 'uppercase',
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3A8A',
    marginTop: 2,
  },
  ownerCompany: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
    marginTop: 2,
  },
  ctaButton: {
    marginTop: 4,
  },
});
*/

/*
================================
CURRENT YELLOW RIDEMATE THEME
================================
*/
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFDF5',
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFDF5',
  },

  loadingText: {
    fontSize: 14,
    color: '#737373',
    fontWeight: '600',
  },

  container: {
    paddingBottom: 30,
    backgroundColor: '#FFFDF5',
  },

  image: {
    width: '100%',
    height: 240,
    backgroundColor: '#F5F5F5',
  },

  contentCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  brand: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B88600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#171717',
    marginTop: 2,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  availBg: {
    backgroundColor: '#DCFCE7',
  },

  rentedBg: {
    backgroundColor: '#FEE2E2',
  },

  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },

  availText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '800',
  },

  rentedText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '800',
  },

  location: {
    fontSize: 14,
    color: '#737373',
    fontWeight: '600',
    marginBottom: 16,
  },

  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF9DB',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFD600',
  },

  priceLabel: {
    fontSize: 11,
    color: '#B88600',
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  priceValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#171717',
    marginTop: 2,
  },

  perDay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#737373',
  },

  typeTag: {
    backgroundColor: '#FFD600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },

  typeTagText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#171717',
  },

  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171717',
    marginBottom: 10,
  },

  datesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFDF5',
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFF9DB',
  },

  dateField: {
    flex: 1,
  },

  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#737373',
    textTransform: 'uppercase',
  },

  fieldValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171717',
    marginTop: 2,
  },

  dateArrow: {
    fontSize: 16,
    color: '#B88600',
    marginHorizontal: 8,
  },

  dateInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  quickLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#737373',
    marginBottom: 6,
    textTransform: 'uppercase',
  },

  durationChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  durationChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E5E5',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },

  durationChipActive: {
    backgroundColor: '#FFD600',
    borderColor: '#FFD600',
  },

  durationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#737373',
  },

  durationTextActive: {
    color: '#171717',
  },

  costSummaryBox: {
    backgroundColor: '#FFF9DB',
    borderColor: '#FFD600',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },

  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  costRowLabel: {
    fontSize: 13,
    color: '#737373',
    fontWeight: '600',
  },

  costRowValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171717',
  },

  costTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#FFE566',
    paddingTop: 8,
    marginTop: 4,
  },

  costTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171717',
  },

  costTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#B88600',
  },

  dateSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  dateSelectorBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderColor: '#FFD600',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 4,
  },

  dateSelectorValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171717',
    marginVertical: 3,
  },

  tapChangeHint: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B88600',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },

  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#171717',
  },

  closeBtnBox: {
    padding: 6,
  },

  closeBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#737373',
  },

  modalSub: {
    fontSize: 12,
    color: '#737373',
    marginBottom: 14,
  },

  datesList: {
    marginBottom: 10,
  },

  dateOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFFDF5',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFF9DB',
  },

  dateOptionActive: {
    backgroundColor: '#FFD600',
    borderColor: '#FFD600',
  },

  dateOptionBadge: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171717',
  },

  dateOptionFull: {
    fontSize: 12,
    color: '#737373',
    marginTop: 2,
  },

  dateOptionActiveText: {
    color: '#171717',
  },

  checkMark: {
    fontSize: 13,
    fontWeight: '900',
    color: '#171717',
  },

  ownerCard: {
    backgroundColor: '#FFF9DB',
    padding: 14,
    borderRadius: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFD600',
  },

  ownerHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B88600',
    textTransform: 'uppercase',
  },

  ownerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171717',
    marginTop: 2,
  },

  ownerCompany: {
    fontSize: 12,
    color: '#B88600',
    fontWeight: '600',
    marginTop: 2,
  },

  ctaButton: {
    marginTop: 4,
  },
});

export default VehicleDetailsScreen;
