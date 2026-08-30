import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../theme/colors';

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
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
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
    backgroundColor: colors.dark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
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
  headerLogo: {
    width: 34,
    height: 34,
    borderRadius: 8,
  },
  backBtn: {
    padding: 4,
  },
  backBtnText: {
    color: colors.textLight,
    fontSize: 22,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textLight,
    letterSpacing: 0.3,
    textAlign: 'center',
    flex: 1,
  },
});

export default HeaderBar;
