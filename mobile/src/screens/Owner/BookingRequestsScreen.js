import React, { useState, useEffect } from 'react';
import { View, FlatList, RefreshControl, StyleSheet, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getOwnerRequestsApi, updateBookingStatusApi } from '../../api/bookings';
import { API_BASE_URL } from '../../utils/config';
import HeaderBar from '../../components/Common/HeaderBar';
import OwnerBookingRequestCard from '../../components/Bookings/OwnerBookingRequestCard';
import EmptyState from '../../components/Common/EmptyState';
import colors from '../../theme/colors';

export const BookingRequestsScreen = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOwnerRequests = async () => {
    try {
      setLoading(true);
      const data = await getOwnerRequestsApi();
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching owner requests:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOwnerRequests();
  }, []);

  const handleUpdateStatus = async (bookingId, status) => {
    try {
      await updateBookingStatusApi(bookingId, status);
      fetchOwnerRequests();
    } catch (err) {
      Alert.alert('Error', err.message || `Failed to update booking status to ${status}`);
    }
  };

  const handleViewDL = (bookingId) => {
    const url = `${API_BASE_URL}/documents/dl/${bookingId}`;
    Linking.openURL(url).catch(err => {
      Alert.alert('Error', 'Unable to open protected document link.');
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <HeaderBar title="Booking Requests" />

      <FlatList
        data={requests}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOwnerRequests(); }} colors={[colors.primaryDark]} />
        }
        renderItem={({ item }) => (
          <OwnerBookingRequestCard
            request={item}
            onAccept={(id) => handleUpdateStatus(id, 'owner_accepted')}
            onReject={(id) => handleUpdateStatus(id, 'rejected')}
            onComplete={(id) => handleUpdateStatus(id, 'completed')}
            onViewDL={item.drivingLicense ? handleViewDL : null}
          />
        )}
        ListEmptyComponent={
          !loading ? <EmptyState title="No Booking Requests" message="When customers request your vehicles, their rental applications will appear here." icon="📋" /> : null
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
    paddingBottom: 90,
  },
});

export default BookingRequestsScreen;
