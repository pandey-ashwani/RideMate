import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export const CategoryChip = ({ label, icon, selected, onPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.chip,
        selected ? styles.chipSelected : styles.chipUnselected,
      ]}
    >
      <Text style={styles.iconText}>{icon}</Text>
      <Text
        style={[
          styles.label,
          selected ? styles.labelSelected : styles.labelUnselected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 10,
    borderWidth: 1.5,
  },
  chipSelected: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  chipUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  iconText: {
    fontSize: 16,
    marginRight: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  labelSelected: {
    color: '#FFFFFF',
  },
  labelUnselected: {
    color: '#475569',
  },
});

export default CategoryChip;
