import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { resolveImageUrl } from '../../utils/config';
import colors from '../../theme/colors';

export const VehicleCard = ({ vehicle, onPress }) => {
  const imageUrl = resolveImageUrl(vehicle.image);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.card}
    >
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.brand} numberOfLines={1}>
            {vehicle.ownerId?.company ? `🏢 ${vehicle.ownerId.company}` : vehicle.brand || 'RideMate Fleet'}
          </Text>
          <View style={[styles.typeBadge, vehicle.type === 'car' ? styles.carBadge : vehicle.type === 'scooter' ? styles.scooterBadge : styles.bikeBadge]}>
            <Text style={styles.typeBadgeText}>{vehicle.type?.toUpperCase() || 'VEHICLE'}</Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {vehicle.name}
        </Text>

        <Text style={styles.location} numberOfLines={1}>
          📍 {vehicle.location || 'Local Fleet'}
        </Text>

        <View style={styles.footerRow}>
          <View>
            <Text style={styles.priceLabel}>Daily Rate</Text>
            <Text style={styles.price}>₹{vehicle.pricePerDay}<Text style={styles.perDay}>/day</Text></Text>
          </View>

          <View style={[styles.availBadge, vehicle.availability ? styles.availTrue : styles.availFalse]}>
            <Text style={[styles.availText, vehicle.availability ? styles.availTrueText : styles.availFalseText]}>
              {vehicle.availability ? 'Available' : 'Rented'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: colors.surfaceMuted,
  },
  content: {
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  brand: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.tabActive,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  carBadge: { backgroundColor: '#F1F5F9' },
  scooterBadge: { backgroundColor: colors.infoBg },
  bikeBadge: { backgroundColor: '#FDF4FF' },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  location: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  priceLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  price: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  perDay: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  availBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  availTrue: { backgroundColor: colors.successBg },
  availFalse: { backgroundColor: colors.errorBg },
  availTrueText: { color: colors.successText, fontSize: 11, fontWeight: '800' },
  availFalseText: { color: colors.errorText, fontSize: 11, fontWeight: '800' },
});

export default VehicleCard;
