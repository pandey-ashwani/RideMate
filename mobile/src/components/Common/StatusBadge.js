import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../../theme/colors';

export const StatusBadge = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'pending':
        return { bg: colors.infoBg, text: colors.infoText, label: 'Pending Response' };
      case 'owner_accepted':
        return { bg: colors.primaryLight, text: colors.tabActive, label: 'Accepted by Owner' };
      case 'confirmed':
        return { bg: colors.successBg, text: colors.successText, label: 'Booking Confirmed' };
      case 'rejected':
        return { bg: colors.errorBg, text: colors.errorText, label: 'Declined' };
      case 'completed':
        return { bg: colors.surfaceMuted, text: colors.textSecondary, label: 'Completed' };
      default:
        return { bg: colors.surfaceMuted, text: colors.textMuted, label: status || 'Unknown' };
    }
  };

  const badge = getBadgeStyle();

  return (
    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
      <Text style={[styles.badgeText, { color: badge.text }]}>
        {badge.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});

export default StatusBadge;
