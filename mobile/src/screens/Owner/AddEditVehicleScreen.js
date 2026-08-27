import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { createVehicleApi, updateVehicleApi, uploadVehicleImageApi } from '../../api/vehicles';
import { resolveImageUrl } from '../../utils/config';
import HeaderBar from '../../components/Common/HeaderBar';
import TouchButton from '../../components/Common/TouchButton';
import CustomInput from '../../components/Common/CustomInput';

export const AddEditVehicleScreen = ({ route, navigation }) => {
  const existingVehicle = route.params?.vehicle;
  const isEditing = !!existingVehicle;

  const [name, setName] = useState(existingVehicle?.name || '');
  const [brand, setBrand] = useState(existingVehicle?.brand || '');
  const [type, setType] = useState(existingVehicle?.type || 'scooter');
  const [pricePerDay, setPricePerDay] = useState(existingVehicle?.pricePerDay ? String(existingVehicle.pricePerDay) : '');
  const [location, setLocation] = useState(existingVehicle?.location || '');
  const [image, setImage] = useState(existingVehicle?.image || '');
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState('');

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required 📷', 'Media library access permission is required to select photos from your device.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        setImageUploading(true);
        setError('');

        const res = await uploadVehicleImageApi(fileUri);
        if (res.path) {
          setImage(res.path);
        } else if (res.url) {
          setImage(res.url);
        }
      }
    } catch (err) {
      console.error('Image upload error:', err);
      setError(err.message || 'Failed to upload image from device');
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name || !brand || !pricePerDay || !location) {
      setError('Please fill in all vehicle details.');
      return;
    }

    if (user?.role === 'owner' && !user?.isVerified && user?.verificationStatus !== 'approved') {
      setError('Verification Required: Admin approval is required before listing vehicles.');
      Alert.alert(
        'Verification Required 🛑',
        'Your vehicle owner account is currently pending Admin verification. Admin approval is required before listing vehicles.'
      );
      return;
    }

    setError('');
    setLoading(true);

    const payload = {
      name: name.trim(),
      brand: brand.trim(),
      type,
      pricePerDay: Number(pricePerDay),
      location: location.trim(),
      image: image.trim() || undefined,
      availability: existingVehicle ? existingVehicle.availability : true,
    };

    try {
      if (isEditing) {
        await updateVehicleApi(existingVehicle._id, payload);
        Alert.alert('Updated! ✅', 'Vehicle listing updated successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await createVehicleApi(payload);
        Alert.alert('Created! 🥳', 'Your new vehicle has been listed for rental.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (err) {
      setError(err.message || 'Failed to save vehicle listing');
    } finally {
      setLoading(false);
    }
  };

  const previewUrl = image ? resolveImageUrl(image) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <HeaderBar title={isEditing ? 'Edit Vehicle' : 'List New Vehicle'} showBack onBackPress={() => navigation.goBack()} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            <Text style={styles.sectionLabel}>Select Vehicle Type</Text>
            <View style={styles.typeSelector}>
              {['scooter', 'bike', 'car'].map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setType(t)}
                  style={[styles.typeOption, type === t && styles.typeOptionActive]}
                >
                  <Text style={[styles.typeOptionText, type === t && styles.typeOptionTextActive]}>
                    {t === 'scooter' ? '🛵 Scooter' : t === 'bike' ? '🏍️ Bike' : '🚗 Car'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Photo Selection Card */}
            <Text style={styles.sectionLabel}>Vehicle Photo</Text>
            <View style={styles.imagePickerBox}>
              {previewUrl ? (
                <Image source={{ uri: previewUrl }} style={styles.previewImage} resizeMode="cover" />
              ) : (
                <View style={styles.placeholderImage}>
                  <Text style={styles.placeholderIcon}>📸</Text>
                  <Text style={styles.placeholderText}>No photo selected yet</Text>
                </View>
              )}

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handlePickImage}
                disabled={imageUploading}
                style={styles.uploadBtn}
              >
                {imageUploading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.uploadBtnText}>📷 Select Photo from Device Gallery</Text>
                )}
              </TouchableOpacity>
            </View>

            <CustomInput
              label="Vehicle Model Name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Honda Activa 6G / Royal Enfield 350"
            />

            <CustomInput
              label="Brand / Make"
              value={brand}
              onChangeText={setBrand}
              placeholder="e.g. Honda, Yamaha, Royal Enfield"
            />

            <CustomInput
              label="Daily Rental Rate (₹/day)"
              value={pricePerDay}
              onChangeText={setPricePerDay}
              placeholder="e.g. 500"
              keyboardType="number-pad"
            />

            <CustomInput
              label="Depot / Pickup Location"
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Dehradun City Depot"
            />

            <TouchButton
              title={loading ? 'Saving...' : isEditing ? 'Update Vehicle' : 'Publish Listing'}
              onPress={handleSubmit}
              loading={loading}
              style={{ marginTop: 8 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeOptionActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  typeOptionTextActive: {
    color: '#FFFFFF',
  },
  imagePickerBox: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 10,
  },
  placeholderImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  placeholderIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  placeholderText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  uploadBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default AddEditVehicleScreen;
