import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getNotificationsApi, markNotificationAsReadApi, markAllNotificationsAsReadApi } from '../../api/notifications';
import HeaderBar from '../../components/Common/HeaderBar';
import EmptyState from '../../components/Common/EmptyState';
import colors from '../../theme/colors';

export const NotificationsScreen = ({ navigation }) => {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      setLoading(true);
      const res = await getNotificationsApi();
      setNotifications(res?.notifications || []);
      setUnreadCount(res?.unreadCount || 0);
    } catch (err) {
      if (err.status !== 401) {
        console.log('Notifications load notice:', err.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsReadApi(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsReadApi();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <HeaderBar title="Notifications" />
        <EmptyState
          icon="🔔"
          title="Sign In to View Alerts"
          message="Sign in or create an account to view real-time booking updates, owner approvals, and notifications."
          buttonTitle="Sign In / Register"
          onButtonPress={() => navigation.navigate('Auth')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <HeaderBar
        title="Notifications"
        rightElement={
          unreadCount > 0 ? (
            <TouchableOpacity onPress={handleMarkAllRead}>
              <Text style={styles.markReadText}>Mark Read</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} colors={[colors.primaryDark]} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => !item.read && handleMarkAsRead(item._id)}
            style={[styles.itemCard, !item.read && styles.unreadCard]}
          >
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              {!item.read && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.itemMessage}>{item.message}</Text>
            <Text style={styles.itemTime}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading ? <EmptyState title="No notifications" message="You're all caught up! Updates regarding your bookings will appear here." icon="🔔" /> : null
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 110,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderColor: colors.border,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  unreadCard: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.primaryLight,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.tabActive,
  },
  itemMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  itemTime: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    alignSelf: 'flex-end',
  },
});

export default NotificationsScreen;
