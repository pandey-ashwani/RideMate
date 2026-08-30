import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ScrollView, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getVehiclesApi } from '../../api/vehicles';
import HeaderBar from '../../components/Common/HeaderBar';
import CategoryChip from '../../components/Common/CategoryChip';
import VehicleCard from '../../components/Vehicles/VehicleCard';
import EmptyState from '../../components/Common/EmptyState';
import colors from '../../theme/colors';

export const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVehicles = async (category = selectedCategory) => {
    try {
      setLoading(true);
      const data = await getVehiclesApi({ type: category });
      setVehicles(data || []);
    } catch (err) {
      console.error('Error fetching home vehicles:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVehicles(selectedCategory);
  }, [selectedCategory]);

  const handleCategorySelect = (catKey) => {
    setSelectedCategory(catKey);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <HeaderBar
        title="RideMate"
        rightElement={
          user ? (
            <TouchableOpacity onPress={() => navigation.navigate('NotificationsTab')}>
              <Text style={{ fontSize: 20 }}>🔔</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => navigation.navigate('Auth')}
              style={styles.loginBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.loginBtnText}>Login</Text>
            </TouchableOpacity>
          )
        }
      />

      <FlatList
        data={vehicles}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchVehicles(); }} colors={[colors.primaryDark]} />
        }
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            {/* Welcome Banner */}
            <View style={styles.banner}>
              <Text style={styles.greeting}>Hello, {user?.name ? user.name.split(' ')[0] : 'Rider'}! 👋</Text>
              <Text style={styles.bannerTitle}>Find your ride for today</Text>
              
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('SearchTab')}
                style={styles.fakeSearchBar}
              >
                <Text style={styles.searchIcon}>🔍</Text>
                <Text style={styles.searchPlaceholder}>Search city, location or vehicle...</Text>
              </TouchableOpacity>
            </View>

            {/* Category Filter Chips */}
            <Text style={styles.sectionTitle}>Categories</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
              <CategoryChip label="All Vehicles" icon="⚡" selected={selectedCategory === 'all'} onPress={() => handleCategorySelect('all')} />
              <CategoryChip label="Scooters" icon="🛵" selected={selectedCategory === 'scooter'} onPress={() => handleCategorySelect('scooter')} />
              <CategoryChip label="Bikes" icon="🏍️" selected={selectedCategory === 'bike'} onPress={() => handleCategorySelect('bike')} />
              <CategoryChip label="Cars" icon="🚗" selected={selectedCategory === 'car'} onPress={() => handleCategorySelect('car')} />
            </ScrollView>

            <View style={styles.listHeaderRow}>
              <Text style={styles.sectionTitle}>Available Rides</Text>
              <Text style={styles.countText}>{vehicles.length} listings</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <VehicleCard
              vehicle={item}
              onPress={() => navigation.navigate('VehicleDetails', { vehicleId: item._id })}
            />
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title="No vehicles available right now"
              message="Check back soon or try selecting a different category."
            />
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

//     paddingHorizontal: 16,
//     paddingTop: 16,
//   },
//   banner: {
//     backgroundColor: '#0F172A',
//     borderRadius: 20,
//     padding: 20,
//     marginBottom: 20,
//   },
//   greeting: {
//     fontSize: 13,
//     color: '#94A3B8',
//     fontWeight: '700',
//   },
//   bannerTitle: {
//     fontSize: 22,
//     fontWeight: '900',
//     color: '#FFFFFF',
//     marginTop: 4,
//     marginBottom: 16,
//   },
//   fakeSearchBar: {
//     backgroundColor: '#1E293B',
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     borderRadius: 12,
//   },
//   searchIcon: {
//     fontSize: 16,
//     marginRight: 10,
//   },
//   searchPlaceholder: {
//     fontSize: 14,
//     color: '#94A3B8',
//     fontWeight: '500',
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '800',
//     color: '#0F172A',
//     marginBottom: 12,
//   },
//   categoryRow: {
//     paddingBottom: 20,
//   },
//   listHeaderRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginBottom: 12,
//   },
//   countText: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: '#0284C7',
//   },
//   cardWrapper: {
//     paddingHorizontal: 16,
//   },
//   listContent: {
//     paddingBottom: 110,
//   },
//   loginBtn: {
//     backgroundColor: '#0284C7',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 8,
//   },
//   loginBtnText: {
//     color: '#FFFFFF',
//     fontWeight: '800',
//     fontSize: 12,
//   },
// });

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  /* Main yellow banner */
  banner: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },

  greeting: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '800',
    opacity: 0.85,
  },

  bannerTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: colors.textPrimary,
    marginTop: 4,
    marginBottom: 16,
  },

  /* Search bar */
  fakeSearchBar: {
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },

  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },

  searchPlaceholder: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },

  /* Section headings */
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
  },

  categoryRow: {
    paddingBottom: 20,
  },

  /* Available rides header */
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  countText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.tabActive,
  },

  /* Vehicle cards */
  cardWrapper: {
    paddingHorizontal: 16,
  },

  listContent: {
    paddingBottom: 110,
  },

  /* Login button */
  loginBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9,
  },

  loginBtnText: {
    color: colors.textOnPrimary,
    fontWeight: '800',
    fontSize: 12,
  },
});

export default HomeScreen;
