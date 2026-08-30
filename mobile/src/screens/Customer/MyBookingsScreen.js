import React, { useState, useEffect } from 'react';
import { View, FlatList, RefreshControl, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getMyBookingsApi, cancelBookingApi } from '../../api/bookings';
import HeaderBar from '../../components/Common/HeaderBar';
import BookingCard from '../../components/Bookings/BookingCard';
import EmptyState from '../../components/Common/EmptyState';
import TouchButton from '../../components/Common/TouchButton';
import colors from '../../theme/colors';

export const MyBookingsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getMyBookingsApi();
      setBookings(data || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = (bookingId) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelBookingApi(bookingId);
              fetchBookings();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  const handleConfirmPress = (booking) => {
    navigation.navigate('BookingConfirmation', { booking });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <HeaderBar title="My Bookings" />

      <FlatList
        data={bookings}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBookings(); }} colors={[colors.primaryDark]} />
        }
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            onConfirmPress={handleConfirmPress}
            onCancelPress={handleCancelBooking}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            !user ? (
              <View style={{ padding: 20 }}>
                <EmptyState
                  title="Sign In Required"
                  message="Please sign in or create an account to view and manage your ride bookings."
                  icon="🔑"
                />
                <TouchButton
                  title="Sign In / Register"
                  onPress={() => navigation.navigate('Auth')}
                  style={{ marginTop: 16 }}
                />
              </View>
            ) : (
              <EmptyState title="No bookings yet" message="Search for available vehicles and request your first ride!" />
            )
          ) : null
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
  listContent: {
    padding: 16,
    paddingBottom: 110,
  },
});

export default MyBookingsScreen;
