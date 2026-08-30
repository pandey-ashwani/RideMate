import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { createVehicleApi, updateVehicleApi, uploadVehicleImageApi } from '../../api/vehicles';
import { resolveImageUrl } from '../../utils/config';
import HeaderBar from '../../components/Common/HeaderBar';
import TouchButton from '../../components/Common/TouchButton';
import CustomInput from '../../components/Common/CustomInput';
import colors from '../../theme/colors';

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
      setError('Failed to upload image. Please try again.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !pricePerDay || !location.trim()) {
      setError('Vehicle Name, Daily Price, and Location are required fields.');
      return;
    }

    const parsedPrice = parseFloat(pricePerDay);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Please enter a valid positive daily rate.');
      return;
    }

    setError('');
    setLoading(true);

    const payload = {
      name: name.trim(),
      brand: brand.trim() || 'RideMate Fleet',
      type,
      pricePerDay: parsedPrice,
      location: location.trim(),
      image: image || '/uploads/vehicles/default-vehicle.jpg',
    };

    try {
      if (isEditing) {
        await updateVehicleApi(existingVehicle._id, payload);
        Alert.alert('Success 🎉', 'Vehicle details updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await createVehicleApi(payload);
        Alert.alert('Success 🎉', 'New vehicle listing added to your fleet!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (err) {
      console.error('Save vehicle error:', err);
      setError(err.message || 'Failed to save vehicle listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <HeaderBar
        title={isEditing ? 'Edit Vehicle Listing' : 'Add New Vehicle'}
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          
          <View style={styles.card}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            {/* Vehicle Type Selector */}
            <Text style={styles.sectionLabel}>Vehicle Category</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                onPress={() => setType('scooter')}
                style={[styles.typeOption, type === 'scooter' && styles.typeOptionActive]}
              >
                <Text style={[styles.typeOptionText, type === 'scooter' && styles.typeOptionTextActive]}>
                  🛵 Scooter
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setType('bike')}
                style={[styles.typeOption, type === 'bike' && styles.typeOptionActive]}
              >
                <Text style={[styles.typeOptionText, type === 'bike' && styles.typeOptionTextActive]}>
                  🏍️ Bike
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setType('car')}
                style={[styles.typeOption, type === 'car' && styles.typeOptionActive]}
              >
                <Text style={[styles.typeOptionText, type === 'car' && styles.typeOptionTextActive]}>
                  🚗 Car
                </Text>
              </TouchableOpacity>
            </View>

            {/* Image Picker */}
            <Text style={styles.sectionLabel}>Vehicle Photo</Text>
            <View style={styles.imagePickerBox}>
              {image ? (
                <Image
                  source={{ uri: resolveImageUrl(image) }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Text style={styles.placeholderIcon}>📸</Text>
                  <Text style={styles.placeholderText}>No photo selected</Text>
                </View>
              )}

              <TouchableOpacity
                onPress={handlePickImage}
                disabled={imageUploading}
                style={styles.uploadBtn}
              >
                {imageUploading ? (
                  <ActivityIndicator color={colors.textOnPrimary} size="small" />
                ) : (
                  <Text style={styles.uploadBtnText}>
                    {image ? '📷 Change Photo' : '📁 Upload Vehicle Photo'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Inputs */}
            <CustomInput
              label="Vehicle Name / Model"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Activa 6G / Royal Enfield 350"
            />

            <CustomInput
              label="Brand / Make"
              value={brand}
              onChangeText={setBrand}
              placeholder="e.g. Honda / Royal Enfield / Hyundai"
            />

            <CustomInput
              label="Rental Price Per Day (₹)"
              value={pricePerDay}
              onChangeText={setPricePerDay}
              placeholder="e.g. 500"
              keyboardType="numeric"
            />

            <CustomInput
              label="Pickup Location / Station"
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Dehradun Clock Tower Depot"
            />

            <TouchButton
              title={loading ? 'Saving...' : isEditing ? 'Save Changes' : '+ Publish Listing'}
              onPress={handleSave}
              loading={loading}
              variant="primary"
              style={{ marginTop: 12 }}
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
    backgroundColor: colors.background,
  },
  container: {
    padding: 16,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorBox: {
    backgroundColor: colors.errorBg,
    borderColor: colors.errorBorder,
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    color: colors.errorText,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  typeOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  typeOptionTextActive: {
    color: colors.textOnPrimary,
    fontWeight: '900',
  },
  imagePickerBox: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1.5,
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
    backgroundColor: colors.borderLight,
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
    color: colors.textMuted,
    fontWeight: '600',
  },
  uploadBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  uploadBtnText: {
    color: colors.textOnPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
});

export default AddEditVehicleScreen;
