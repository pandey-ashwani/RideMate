import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getVehiclesApi } from '../../api/vehicles';
import HeaderBar from '../../components/Common/HeaderBar';
import CustomInput from '../../components/Common/CustomInput';
import CategoryChip from '../../components/Common/CategoryChip';
import VehicleCard from '../../components/Vehicles/VehicleCard';
import EmptyState from '../../components/Common/EmptyState';

export const VehicleSearchScreen = ({ navigation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchVehicles = async () => {
    try {
      setLoading(true);
      const data = await getVehiclesApi({
        search: searchTerm.trim(),
        type: selectedType,
      });
      setVehicles(data || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchVehicles();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedType]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <HeaderBar title="Search Rides" />

      <View style={styles.searchHeader}>
        <CustomInput
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Enter location, city or model name..."
          style={{ marginBottom: 12 }}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <CategoryChip label="All" icon="⚡" selected={selectedType === 'all'} onPress={() => setSelectedType('all')} />
          <CategoryChip label="Scooters" icon="🛵" selected={selectedType === 'scooter'} onPress={() => setSelectedType('scooter')} />
          <CategoryChip label="Bikes" icon="🏍️" selected={selectedType === 'bike'} onPress={() => setSelectedType('bike')} />
          <CategoryChip label="Cars" icon="🚗" selected={selectedType === 'car'} onPress={() => setSelectedType('car')} />
        </ScrollView>
      </View>

      <FlatList
        data={vehicles}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <VehicleCard
              vehicle={item}
              onPress={() => navigation.navigate('VehicleDetails', { vehicleId: item._id })}
            />
          </View>
        )}
        ListEmptyComponent={
          !loading ? <EmptyState title="No matching rides" message="Try searching for another city or vehicle type." /> : null
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  searchHeader: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  chipRow: {
    paddingVertical: 4,
  },
  cardWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  listContent: {
    paddingBottom: 110,
  },
});

export default VehicleSearchScreen;
