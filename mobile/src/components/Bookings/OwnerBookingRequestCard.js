import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import StatusBadge from '../Common/StatusBadge';
import TouchButton from '../Common/TouchButton';
import colors from '../../theme/colors';

export const OwnerBookingRequestCard = ({ request, onAccept, onReject, onComplete, onViewDL }) => {
  const customer = request.customerId || {};
  const vehicle = request.vehicleId || {};
  const pickup = request.pickupDate ? new Date(request.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A';
  const dropoff = request.dropoffDate ? new Date(request.dropoffDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{customer.name || 'Customer'}</Text>
          <Text style={styles.customerEmail}>{customer.email || 'N/A'}</Text>
        </View>
        <StatusBadge status={request.status} />
      </View>

      <View style={styles.vehicleDetails}>
        <Text style={styles.vehicleName}>🚗 {vehicle.name || 'Vehicle Listing'}</Text>
        <Text style={styles.priceTag}>₹{request.totalCost || 0} Total</Text>
      </View>

      <View style={styles.datesRow}>
        <Text style={styles.dateText}>Rental Period: <Text style={styles.boldText}>{pickup} – {dropoff}</Text></Text>
      </View>

      {request.drivingLicense ? (
        <View style={styles.dlDetails}>
          <Text style={styles.dlText}>DL Number: <Text style={styles.boldText}>{request.drivingLicense}</Text></Text>
          {request.pickupLocation && (
            <Text style={styles.dlText}>Pickup: <Text style={styles.boldText}>{request.pickupLocation}</Text></Text>
          )}
          {onViewDL && (
            <TouchButton
              title="📄 View Driving License Photo"
              onPress={() => onViewDL(request._id)}
              variant="outline"
              style={{ marginTop: 8, minHeight: 40 }}
            />
          )}
        </View>
      ) : null}

      {/* Action Buttons depending on status */}
      {request.status === 'pending' && (
        <View style={styles.actionsRow}>
          <TouchButton
            title="Decline"
            onPress={() => onReject && onReject(request._id)}
            variant="danger"
            style={styles.halfBtn}
          />
          <TouchButton
            title="Accept Request"
            onPress={() => onAccept && onAccept(request._id)}
            variant="primary"
            style={styles.halfBtn}
          />
        </View>
      )}

      {request.status === 'confirmed' && onComplete && (
        <TouchButton
          title="Mark Ride Completed"
          onPress={() => onComplete(request._id)}
          variant="secondary"
          style={{ marginTop: 10 }}
        />
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
    marginBottom: 10,
  },
  customerInfo: {
    flex: 1,
    marginRight: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  customerEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  vehicleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  priceTag: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.tabActive,
  },
  datesRow: {
    marginBottom: 6,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  boldText: {
    fontWeight: '800',
    color: colors.textPrimary,
  },
  dlDetails: {
    backgroundColor: colors.infoBg,
    borderColor: colors.infoBorder,
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  dlText: {
    fontSize: 12,
    color: colors.infoText,
    marginBottom: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  halfBtn: {
    flex: 1,
  },
});

export default OwnerBookingRequestCard;
