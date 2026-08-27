import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const StatusBadge = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'pending':
        return { bg: '#FEF3C7', text: '#D97706', label: 'Pending Response' };
      case 'owner_accepted':
        return { bg: '#E0F2FE', text: '#0284C7', label: 'Accepted by Owner' };
      case 'confirmed':
        return { bg: '#D1FAE5', text: '#059669', label: 'Booking Confirmed' };
      case 'rejected':
        return { bg: '#FEE2E2', text: '#DC2626', label: 'Declined' };
      case 'completed':
        return { bg: '#F1F5F9', text: '#475569', label: 'Completed' };
      default:
        return { bg: '#F1F5F9', text: '#64748B', label: status || 'Unknown' };
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
