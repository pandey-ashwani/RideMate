import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getOwnerRequestsApi, updateBookingStatusApi } from '../../api/bookings';
import { getVehiclesApi } from '../../api/vehicles';
import { API_BASE_URL } from '../../utils/config';
import HeaderBar from '../../components/Common/HeaderBar';
import OwnerBookingRequestCard from '../../components/Bookings/OwnerBookingRequestCard';
import TouchButton from '../../components/Common/TouchButton';
import colors from '../../theme/colors';

export const OwnerDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();

  const [requests, setRequests] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [reqData, vehData] = await Promise.all([
        getOwnerRequestsApi().catch(() => []),
        getVehiclesApi({ ownerId: user._id }).catch(() => []),
      ]);
      setRequests(Array.isArray(reqData) ? reqData : []);
      const myFleet = (Array.isArray(vehData) ? vehData : []).filter(v => {
        const oId = typeof v.ownerId === 'object' ? v.ownerId?._id : v.ownerId;
        return String(oId) === String(user?._id);
      });
      setVehicles(myFleet);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleUpdateStatus = async (bookingId, status) => {
    try {
      setLoading(true);
      await updateBookingStatusApi(bookingId, status);
      Alert.alert(
        'Success',
        status === 'owner_accepted'
          ? 'Booking request accepted! Customer has been notified to confirm pickup details.'
          : status === 'rejected'
          ? 'Booking request declined.'
          : 'Ride marked as completed.'
      );
      await loadDashboardData();
    } catch (err) {
      Alert.alert('Error', err.message || `Failed to update booking status to ${status}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDL = (bookingId) => {
    const url = `${API_BASE_URL}/documents/dl/${bookingId}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open protected document link.');
    });
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const activeRentals = requests.filter(r => r.status === 'confirmed' || r.status === 'owner_accepted');

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <HeaderBar title="Owner Dashboard" />

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDashboardData(); }} colors={[colors.primaryDark]} />
        }
      >
        <View style={styles.welcomeBanner}>
          <Text style={styles.welcomeSubtitle}>Vehicle Host Hub</Text>
          <Text style={styles.welcomeTitle}>{user?.company || user?.name || 'My Fleet'}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.infoBg, borderColor: colors.infoBorder, borderWidth: 1 }]}>
            <Text style={[styles.statNumber, { color: colors.tabActive }]}>{vehicles.length}</Text>
            <Text style={styles.statLabel}>My Fleet</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.warningBg, borderColor: colors.warningBorder, borderWidth: 1 }]}>
            <Text style={[styles.statNumber, { color: colors.warningText }]}>{pendingRequests.length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.successBg, borderColor: colors.successBorder, borderWidth: 1 }]}>
            <Text style={[styles.statNumber, { color: colors.successText }]}>{activeRentals.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionRow}>
          <TouchButton
            title="+ Add Vehicle"
            onPress={() => navigation.navigate('AddEditVehicle')}
            variant="primary"
            style={styles.actionBtn}
          />
          <TouchButton
            title="View Requests"
            onPress={() => navigation.navigate('RequestsTab')}
            variant="outline"
            style={styles.actionBtn}
          />
        </View>

        {/* Pending Requests Section */}
        {pendingRequests.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Booking Requests ({pendingRequests.length})</Text>
            {pendingRequests.map((req) => (
              <OwnerBookingRequestCard
                key={req._id}
                request={req}
                onAccept={(id) => handleUpdateStatus(id, 'owner_accepted')}
                onReject={(id) => handleUpdateStatus(id, 'rejected')}
                onComplete={(id) => handleUpdateStatus(id, 'completed')}
                onViewDL={req.drivingLicense ? handleViewDL : null}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 16,
    paddingBottom: 90,
  },
  welcomeBanner: {
    backgroundColor: colors.dark,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  welcomeSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textLight,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
  },
});

export default OwnerDashboardScreen;
