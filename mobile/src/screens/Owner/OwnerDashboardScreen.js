import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getOwnerRequestsApi } from '../../api/bookings';
import { getVehiclesApi } from '../../api/vehicles';
import HeaderBar from '../../components/Common/HeaderBar';
import OwnerBookingRequestCard from '../../components/Bookings/OwnerBookingRequestCard';
import TouchButton from '../../components/Common/TouchButton';

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

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const activeRentals = requests.filter(r => r.status === 'confirmed' || r.status === 'owner_accepted');

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <HeaderBar title="Owner Dashboard" />

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDashboardData(); }} colors={['#0284C7']} />
        }
      >
        <View style={styles.welcomeBanner}>
          <Text style={styles.welcomeSubtitle}>Vehicle Host Hub</Text>
          <Text style={styles.welcomeTitle}>{user?.company || user?.name || 'My Fleet'}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#E0F2FE' }]}>
            <Text style={[styles.statNumber, { color: '#0284C7' }]}>{vehicles.length}</Text>
            <Text style={styles.statLabel}>My Fleet</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.statNumber, { color: '#D97706' }]}>{pendingRequests.length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
            <Text style={[styles.statNumber, { color: '#059669' }]}>{activeRentals.length}</Text>
            <Text style={styles.statLabel}>Active Rides</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionRow}>
          <TouchButton
            title="+ Add New Vehicle"
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
            <Text style={styles.sectionTitle}>⚠️ Action Required ({pendingRequests.length})</Text>
            {pendingRequests.map(req => (
              <OwnerBookingRequestCard
                key={req._id}
                request={req}
                onAccept={() => navigation.navigate('RequestsTab')}
                onReject={() => navigation.navigate('RequestsTab')}
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
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: 16,
    paddingBottom: 90,
  },
  welcomeBanner: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  welcomeSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38BDF8',
    textTransform: 'uppercase',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
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
    color: '#475569',
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
    color: '#0F172A',
    marginBottom: 12,
  },
});

export default OwnerDashboardScreen;
