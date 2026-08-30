import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import StatusBadge from '../Common/StatusBadge';
import TouchButton from '../Common/TouchButton';
import colors from '../../theme/colors';

export const BookingCard = ({ booking, onConfirmPress, onCancelPress }) => {
  const vehicle = booking.vehicleId || {};
  const pickup = booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A';
  const dropoff = booking.dropoffDate ? new Date(booking.dropoffDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A';

  const dailyRate = Number(vehicle.pricePerDay || 0);
  const start = booking.pickupDate ? new Date(booking.pickupDate) : null;
  const end = booking.dropoffDate ? new Date(booking.dropoffDate) : null;
  const days = (start && end) ? (Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1) : 1;
  const computedCost = booking.totalCost && booking.totalCost > 0 ? booking.totalCost : (dailyRate * days);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName} numberOfLines={1}>{vehicle.name || 'Rental Vehicle'}</Text>
          <Text style={styles.brand}>{vehicle.brand || 'Vehicle'}</Text>
        </View>
        <StatusBadge status={booking.status} />
      </View>

      <View style={styles.datesRow}>
        <View style={styles.dateBlock}>
          <Text style={styles.dateLabel}>Pickup</Text>
          <Text style={styles.dateValue}>{pickup}</Text>
        </View>
        <Text style={styles.arrow}>➔</Text>
        <View style={styles.dateBlock}>
          <Text style={styles.dateLabel}>Return</Text>
          <Text style={styles.dateValue}>{dropoff}</Text>
        </View>
        <View style={styles.costBlock}>
          <Text style={styles.dateLabel}>Total Cost</Text>
          <Text style={styles.costValue}>₹{computedCost}</Text>
        </View>
      </View>

      {booking.pickupLocation ? (
        <View style={styles.locationBox}>
          <Text style={styles.locationLabel}>Pickup Location:</Text>
          <Text style={styles.locationValue}>📍 {booking.pickupLocation}</Text>
        </View>
      ) : null}

      {/* Action for Owner Accepted -> Customer needs to submit Driving License & Pickup Location */}
      {booking.status === 'owner_accepted' && (
        <View style={styles.actionBox}>
          <Text style={styles.actionNotice}>
            🎉 Owner accepted your request! Submit driving license & pickup location to confirm.
          </Text>
          <TouchButton
            title="Submit License & Confirm"
            onPress={() => onConfirmPress(booking)}
            variant="primary"
            style={{ marginTop: 8 }}
          />
        </View>
      )}

      {booking.status === 'pending' && onCancelPress && (
        <TouchableOpacity onPress={() => onCancelPress(booking._id)} style={styles.cancelLink}>
          <Text style={styles.cancelText}>Cancel Booking Request</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  vehicleInfo: {
    flex: 1,
    marginRight: 10,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  brand: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceMuted,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  dateBlock: {
    alignItems: 'flex-start',
  },
  costBlock: {
    alignItems: 'flex-end',
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  costValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.tabActive,
    marginTop: 2,
  },
  arrow: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: 'bold',
  },
  locationBox: {
    marginTop: 4,
    marginBottom: 6,
  },
  locationLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  locationValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: 2,
  },
  actionBox: {
    backgroundColor: colors.successBg,
    borderColor: colors.successBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  actionNotice: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.successText,
    lineHeight: 16,
  },
  cancelLink: {
    alignSelf: 'center',
    paddingVertical: 6,
    marginTop: 4,
  },
  cancelText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '700',
  },
});

export default BookingCard;
