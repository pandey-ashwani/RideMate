import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getVehiclesApi, updateVehicleApi, deleteVehicleApi } from '../../api/vehicles';
import { resolveImageUrl } from '../../utils/config';
import HeaderBar from '../../components/Common/HeaderBar';
import TouchButton from '../../components/Common/TouchButton';
import colors from '../../theme/colors';

export const MyVehiclesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isVerifiedOwner = user?.role === 'admin' || user?.isVerified || user?.verificationStatus === 'approved';

  const fetchMyVehicles = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getVehiclesApi({ ownerId: user._id });
      // Filter vehicles belonging to authenticated owner
      const myFleet = (data || []).filter(v => {
        const oId = typeof v.ownerId === 'object' ? v.ownerId?._id : v.ownerId;
        return String(oId) === String(user?._id);
      });
      setVehicles(myFleet);
    } catch (err) {
      console.error('Error fetching owner vehicles:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyVehicles();
  }, []);

  const handleAddVehiclePress = () => {
    if (!isVerifiedOwner) {
      Alert.alert(
        'Verification Required 🛑',
        'Your vehicle owner account must be verified & approved by an Administrator before listing vehicles on RideMate.',
        [{ text: 'OK' }]
      );
      return;
    }
    navigation.navigate('AddEditVehicle');
  };

  const handleToggleAvailability = async (vehicle) => {
    try {
      const newAvail = !vehicle.availability;
      await updateVehicleApi(vehicle._id, { availability: newAvail });
      setVehicles(prev => prev.map(v => v._id === vehicle._id ? { ...v, availability: newAvail } : v));
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update vehicle availability');
    }
  };

  const handleDeleteVehicle = (vehicleId) => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this vehicle listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVehicleApi(vehicleId);
              fetchMyVehicles();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete vehicle');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <HeaderBar
        title="My Fleet"
        rightElement={
          <TouchableOpacity onPress={handleAddVehiclePress}>
            <Text style={{ fontSize: 22, color: isVerifiedOwner ? '#38BDF8' : '#94A3B8', fontWeight: 'bold' }}>＋</Text>
          </TouchableOpacity>
        }
      />

      {/* Admin Verification Banner */}
      {!isVerifiedOwner ? (
        <View style={styles.verificationBanner}>
          <Text style={styles.bannerTitle}>⚠️ Admin Verification Pending</Text>
          <Text style={styles.bannerSub}>
            Admin verification & approval is required before listing vehicles for rent. Your vehicle owner account is currently pending verification.
          </Text>
          <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('ProfileTab')}>
            <Text style={styles.profileBtnText}>🪪 Upload Documents & Check Status</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={vehicles}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMyVehicles(); }} colors={['#0284C7']} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: resolveImageUrl(item.image) }} style={styles.image} resizeMode="cover" />

            <View style={styles.content}>
              <View style={styles.titleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.brand}>{item.brand}</Text>
                  <Text style={styles.title}>{item.name}</Text>
                </View>
                <Text style={styles.price}>₹{item.pricePerDay}/day</Text>
              </View>

              <Text style={styles.location}>📍 {item.location}</Text>

              <View style={styles.actionsRow}>
                <TouchButton
                  title={item.availability ? 'Available' : 'Rented'}
                  onPress={() => handleToggleAvailability(item)}
                  variant={item.availability ? 'success' : 'outline'}
                  style={{ flex: 1, marginRight: 6 }}
                />

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    if (!isVerifiedOwner) {
                      Alert.alert('Verification Required', 'Your owner account is awaiting admin approval.');
                      return;
                    }
                    navigation.navigate('AddEditVehicle', { vehicle: item });
                  }}
                  style={styles.editBtn}
                >
                  <Text style={styles.editBtnText}>✏️ Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleDeleteVehicle(item._id)}
                  style={styles.deleteBtn}
                >
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🛵</Text>
            <Text style={styles.emptyTitle}>No Vehicles Listed Yet</Text>
            <Text style={styles.emptySub}>
              {isVerifiedOwner
                ? 'Tap the + button in the header bar to publish your first vehicle rental listing.'
                : 'Your account is pending Admin Verification. Once approved by Admin, you can list your fleet here.'}
            </Text>
            {isVerifiedOwner ? (
              <TouchButton
                title="+ Add New Vehicle Listing"
                onPress={handleAddVehiclePress}
                style={{ marginTop: 16 }}
              />
            ) : null}
          </View>
        }
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
  verificationBanner: {
    backgroundColor: colors.warningBg,
    borderColor: colors.warningBorder,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    margin: 16,
    marginBottom: 0,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.warningText,
    marginBottom: 4,
  },
  bannerSub: {
    fontSize: 12,
    color: colors.warningText,
    lineHeight: 17,
    marginBottom: 12,
  },
  profileBtn: {
    backgroundColor: colors.surface,
    borderColor: colors.warningBorder,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  profileBtnText: {
    color: colors.warningText,
    fontSize: 12,
    fontWeight: '800',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 150,
    backgroundColor: colors.surfaceMuted,
  },
  content: {
    padding: 14,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  brand: {
    fontSize: 12,
    color: colors.tabActive,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  price: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  location: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editBtn: {
    backgroundColor: colors.infoBg,
    borderWidth: 1,
    borderColor: colors.infoBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 6,
  },
  editBtnText: {
    color: colors.tabActive,
    fontWeight: '800',
    fontSize: 13,
  },
  deleteBtn: {
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 6,
  },
  deleteBtnText: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default MyVehiclesScreen;
