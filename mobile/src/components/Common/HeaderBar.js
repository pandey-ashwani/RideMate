import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const HeaderBar = ({ title, showBack = false, onBackPress, rightElement }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity onPress={onBackPress} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>RM</Text>
          </View>
        )}
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {title || 'RideMate'}
      </Text>

      <View style={styles.right}>
        {rightElement || null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  left: {
    minWidth: 40,
    alignItems: 'flex-start',
  },
  right: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#0F172A',
    fontWeight: '900',
    fontSize: 15,
  },
  backBtn: {
    padding: 4,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textAlign: 'center',
    flex: 1,
  },
});

export default HeaderBar;
