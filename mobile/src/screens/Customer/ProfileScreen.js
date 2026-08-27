import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Modal, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { uploadVehicleImageApi } from '../../api/vehicles';
import { resolveImageUrl } from '../../utils/config';
import HeaderBar from '../../components/Common/HeaderBar';
import TouchButton from '../../components/Common/TouchButton';
import CustomInput from '../../components/Common/CustomInput';

export const ProfileScreen = ({ navigation }) => {
  const { user, logout, updateProfile } = useAuth();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editCompany, setEditCompany] = useState(user?.company || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
  const [editDrivingLicense, setEditDrivingLicense] = useState(user?.drivingLicense || '');
  const [editVerificationDoc, setEditVerificationDoc] = useState(user?.verificationDoc || '');
  const [saveLoading, setSaveLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [licenseUploading, setLicenseUploading] = useState(false);
  const [docUploading, setDocUploading] = useState(false);
  const [error, setError] = useState('');

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of RideMate?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const openEditModal = () => {
    setEditName(user?.name || '');
    setEditPhone(user?.phone || '');
    setEditCompany(user?.company || '');
    setEditAvatar(user?.avatar || '');
    setEditDrivingLicense(user?.drivingLicense || '');
    setEditVerificationDoc(user?.verificationDoc || '');
    setError('');
    setEditModalOpen(true);
  };

  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required 📷', 'Media library access is required to select profile avatar photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        setAvatarUploading(true);
        setError('');

        const res = await uploadVehicleImageApi(fileUri);
        if (res.path) {
          setEditAvatar(res.path);
        } else if (res.url) {
          setEditAvatar(res.url);
        }
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      setError(err.message || 'Failed to upload profile photo');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handlePickLicense = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required 📷', 'Media library access is required to select driving license photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        setLicenseUploading(true);
        setError('');

        const res = await uploadVehicleImageApi(fileUri);
        const uploadedPath = res.path || res.url;
        if (uploadedPath) {
          setEditDrivingLicense(uploadedPath);
        }
      }
    } catch (err) {
      console.error('License upload error:', err);
      setError(err.message || 'Failed to upload driving license photo');
    } finally {
      setLicenseUploading(false);
    }
  };

  const handlePickVerificationDoc = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required 📷', 'Media library access is required to select business verification document.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        setDocUploading(true);
        setError('');

        const res = await uploadVehicleImageApi(fileUri);
        const uploadedPath = res.path || res.url;
        if (uploadedPath) {
          setEditVerificationDoc(uploadedPath);
        }
      }
    } catch (err) {
      console.error('Doc upload error:', err);
      setError(err.message || 'Failed to upload verification document');
    } finally {
      setDocUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setError('Name cannot be empty.');
      return;
    }

    setError('');
    setSaveLoading(true);

    const payload = {
      name: editName.trim(),
      phone: editPhone.trim(),
      avatar: editAvatar.trim(),
      drivingLicense: editDrivingLicense.trim(),
    };

    if (user?.role === 'owner') {
      payload.company = editCompany.trim();
      payload.verificationDoc = editVerificationDoc.trim();
      if (user?.verificationStatus === 'rejected') {
        payload.resubmitVerification = true;
      }
    }

    const res = await updateProfile(payload);
    setSaveLoading(false);

    if (res.success) {
      setEditModalOpen(false);
      Alert.alert('Profile Updated! ✅', 'Your account details & driving license photo have been updated successfully.');
    } else {
      setError(res.message || 'Failed to update profile.');
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <HeaderBar title="My Account" />
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.profileHeaderCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>👤</Text>
            </View>
            <Text style={styles.name}>Welcome Guest!</Text>
            <Text style={styles.email}>Sign in to rent vehicles, track bookings, or list your fleet.</Text>
          </View>
          <TouchButton
            title="Sign In / Register Account"
            onPress={() => navigation.navigate('Auth')}
            style={{ marginTop: 12 }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const avatarUrl = user?.avatar ? resolveImageUrl(user.avatar) : null;
  const editAvatarUrl = editAvatar ? resolveImageUrl(editAvatar) : null;

  const licenseUrl = user?.drivingLicense ? resolveImageUrl(user.drivingLicense) : null;
  const editLicenseUrl = editDrivingLicense ? resolveImageUrl(editDrivingLicense) : null;
  const editDocUrl = editVerificationDoc ? resolveImageUrl(editVerificationDoc) : null;

  const isOwner = user?.role === 'owner';
  const isApprovedOwner = isOwner && (user?.isVerified || user?.verificationStatus === 'approved');

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <HeaderBar
        title="My Account"
        rightElement={
          <TouchableOpacity onPress={openEditModal}>
            <Text style={styles.headerEditBtn}>✏️ Edit</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarCircle}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitial}>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</Text>
            )}
          </View>

          <Text style={styles.name}>{user?.name || 'RideMate User'}</Text>
          <Text style={styles.email}>{user?.email || 'N/A'}</Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'CUSTOMER'}</Text>
          </View>
        </View>

        {/* Owner Admin Verification Status Card */}
        {isOwner ? (
          <View style={[styles.statusCard, isApprovedOwner ? styles.approvedStatus : styles.pendingStatus]}>
            <Text style={styles.statusTitle}>
              {isApprovedOwner ? '✅ Admin Verified Owner' : '⚠️ Admin Verification Pending'}
            </Text>
            <Text style={styles.statusSub}>
              {isApprovedOwner
                ? 'Your vehicle owner account is fully verified & approved by Admin. You can publish vehicle listings.'
                : 'Admin approval is required before listing vehicles for rent. Once verified by Admin, your listings will be published.'}
            </Text>
          </View>
        ) : null}

        {/* Account Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Account Details</Text>
            <TouchableOpacity onPress={openEditModal}>
              <Text style={styles.editLink}>✏️ Edit Profile</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue}>{user?.name || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mobile Phone</Text>
            <Text style={styles.infoValue}>{user?.phone || 'Not Provided'}</Text>
          </View>

          {isOwner || user?.company ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Company / Fleet</Text>
              <Text style={styles.infoValue}>{user?.company || 'Not Provided'}</Text>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Contact Verification</Text>
            <Text style={[styles.infoValue, { color: user?.emailVerified || user?.phoneVerified ? '#059669' : '#DC2626' }]}>
              {user?.emailVerified || user?.phoneVerified ? '✅ Verified' : '⚠️ Pending'}
            </Text>
          </View>
        </View>

        {/* Driving License Photo Card */}
        <View style={styles.infoCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>🪪 Driving License Photo</Text>
            <TouchableOpacity onPress={openEditModal}>
              <Text style={styles.editLink}>📷 Upload / Change</Text>
            </TouchableOpacity>
          </View>

          {licenseUrl ? (
            <View style={styles.licensePreviewCard}>
              <Image source={{ uri: licenseUrl }} style={styles.licenseImage} resizeMode="cover" />
              <View style={styles.licenseTag}>
                <Text style={styles.licenseTagText}>✅ License Photo Uploaded</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadPlaceholderCard} onPress={openEditModal}>
              <Text style={{ fontSize: 24, marginBottom: 4 }}>📷</Text>
              <Text style={styles.uploadPlaceholderTitle}>Add Driving License Photo</Text>
              <Text style={styles.uploadPlaceholderSub}>Tap to upload your driving license from local device gallery</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchButton
          title="✏️ Edit Profile & Driving License"
          onPress={openEditModal}
          variant="outline"
          style={{ marginBottom: 12 }}
        />

        <TouchButton
          title="Sign Out of RideMate"
          onPress={handleLogout}
          variant="danger"
          style={styles.logoutBtn}
        />
      </ScrollView>

      {/* Edit Profile & Driving License Modal */}
      <Modal
        visible={editModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✏️ Edit Profile & License</Text>
              <TouchableOpacity onPress={() => setEditModalOpen(false)} style={{ padding: 4 }}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '85%' }}>
              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {error}</Text>
                </View>
              ) : null}

              {/* Avatar Selector */}
              <View style={styles.avatarPickerRow}>
                <View style={styles.avatarPickerCircle}>
                  {editAvatarUrl ? (
                    <Image source={{ uri: editAvatarUrl }} style={styles.avatarPickerImage} />
                  ) : (
                    <Text style={styles.avatarPickerInitial}>
                      {editName ? editName.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handlePickAvatar}
                  disabled={avatarUploading}
                  style={styles.uploadAvatarBtn}
                >
                  {avatarUploading ? (
                    <ActivityIndicator size="small" color="#0284C7" />
                  ) : (
                    <Text style={styles.uploadAvatarText}>📷 Change Profile Photo</Text>
                  )}
                </TouchableOpacity>
              </View>

              <CustomInput
                label="Full Name"
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your full name"
              />

              <CustomInput
                label="Mobile Phone"
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Enter mobile phone number"
                keyboardType="phone-pad"
              />

              {isOwner ? (
                <CustomInput
                  label="Company / Fleet Name"
                  value={editCompany}
                  onChangeText={setEditCompany}
                  placeholder="Enter business or company name"
                />
              ) : null}

              {/* Driving License Device Photo Selection */}
              <Text style={styles.fieldLabel}>🪪 Driving License Photo (Local Device)</Text>
              <View style={styles.imagePickerCard}>
                {editLicenseUrl ? (
                  <View style={styles.previewContainer}>
                    <Image source={{ uri: editLicenseUrl }} style={styles.licensePickerImage} resizeMode="cover" />
                    <TouchableOpacity style={styles.repickBtn} onPress={handlePickLicense} disabled={licenseUploading}>
                      <Text style={styles.repickBtnText}>📷 Change License Photo</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.pickerBox} onPress={handlePickLicense} disabled={licenseUploading}>
                    {licenseUploading ? (
                      <ActivityIndicator size="small" color="#0284C7" />
                    ) : (
                      <>
                        <Text style={{ fontSize: 26, marginBottom: 4 }}>📷</Text>
                        <Text style={styles.pickerBoxTitle}>Select Driving License Photo</Text>
                        <Text style={styles.pickerBoxSub}>Tap to pick driving license image from phone gallery</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* Owner Document Picker */}
              {isOwner ? (
                <>
                  <Text style={styles.fieldLabel}>🏢 Business ID / Govt Document (Local Device)</Text>
                  <View style={styles.imagePickerCard}>
                    {editDocUrl ? (
                      <View style={styles.previewContainer}>
                        <Image source={{ uri: editDocUrl }} style={styles.licensePickerImage} resizeMode="cover" />
                        <TouchableOpacity style={styles.repickBtn} onPress={handlePickVerificationDoc} disabled={docUploading}>
                          <Text style={styles.repickBtnText}>📷 Change Business Document</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.pickerBox} onPress={handlePickVerificationDoc} disabled={docUploading}>
                        {docUploading ? (
                          <ActivityIndicator size="small" color="#0284C7" />
                        ) : (
                          <>
                            <Text style={{ fontSize: 26, marginBottom: 4 }}>📄</Text>
                            <Text style={styles.pickerBoxTitle}>Select Verification Document</Text>
                            <Text style={styles.pickerBoxSub}>Upload business or owner ID for Admin Verification</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              ) : null}

              <TouchButton
                title={saveLoading ? 'Saving Profile...' : 'Save Profile & License'}
                onPress={handleSaveProfile}
                disabled={saveLoading}
                style={{ marginTop: 12, marginBottom: 20 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#F8FAFC',
//   },
//   container: {
//     padding: 16,
//   },
//   profileHeaderCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     padding: 20,
//     alignItems: 'center',
//     marginBottom: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 2,
//   },
//   avatarCircle: {
//     width: 84,
//     height: 84,
//     borderRadius: 42,
//     backgroundColor: '#E0F2FE',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 12,
//     overflow: 'hidden',
//     borderWidth: 3,
//     borderColor: '#38BDF8',
//   },
//   avatarImage: {
//     width: '100%',
//     height: '100%',
//   },
//   avatarInitial: {
//     fontSize: 34,
//     fontWeight: '800',
//     color: '#0284C7',
//   },
//   name: {
//     fontSize: 20,
//     fontWeight: '800',
//     color: '#0F172A',
//     marginBottom: 2,
//   },
//   email: {
//     fontSize: 14,
//     color: '#64748B',
//     marginBottom: 10,
//   },
//   roleBadge: {
//     backgroundColor: '#F1F5F9',
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   roleText: {
//     fontSize: 11,
//     fontWeight: '800',
//     color: '#0284C7',
//     letterSpacing: 0.5,
//   },
//   statusCard: {
//     borderRadius: 12,
//     padding: 14,
//     marginBottom: 16,
//   },
//   pendingStatus: {
//     backgroundColor: '#FEF3C7',
//     borderWidth: 1,
//     borderColor: '#F59E0B',
//   },
//   approvedStatus: {
//     backgroundColor: '#D1FAE5',
//     borderWidth: 1,
//     borderColor: '#10B981',
//   },
//   statusTitle: {
//     fontSize: 14,
//     fontWeight: '800',
//     color: '#0F172A',
//     marginBottom: 4,
//   },
//   statusSub: {
//     fontSize: 12,
//     color: '#334155',
//     lineHeight: 17,
//   },
//   infoCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 2,
//   },
//   sectionHeaderRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//     paddingBottom: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F1F5F9',
//   },
//   sectionTitle: {
//     fontSize: 15,
//     fontWeight: '800',
//     color: '#0F172A',
//   },
//   editLink: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: '#0284C7',
//   },
//   headerEditBtn: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: '#FFFFFF',
//   },
//   infoRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 8,
//   },
//   infoLabel: {
//     fontSize: 13,
//     color: '#64748B',
//     fontWeight: '600',
//   },
//   infoValue: {
//     fontSize: 14,
//     color: '#0F172A',
//     fontWeight: '700',
//   },
//   licensePreviewCard: {
//     borderRadius: 12,
//     overflow: 'hidden',
//     borderWidth: 1,
//     borderColor: '#CBD5E1',
//     marginTop: 4,
//   },
//   licenseImage: {
//     width: '100%',
//     height: 160,
//   },
//   licenseTag: {
//     backgroundColor: '#059669',
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     alignItems: 'center',
//   },
//   licenseTagText: {
//     color: '#FFFFFF',
//     fontSize: 12,
//     fontWeight: '800',
//   },
//   uploadPlaceholderCard: {
//     borderWidth: 2,
//     borderColor: '#BAE6FD',
//     borderStyle: 'dashed',
//     borderRadius: 12,
//     padding: 16,
//     alignItems: 'center',
//     backgroundColor: '#F0F9FF',
//   },
//   uploadPlaceholderTitle: {
//     fontSize: 14,
//     fontWeight: '800',
//     color: '#0284C7',
//     marginBottom: 2,
//   },
//   uploadPlaceholderSub: {
//     fontSize: 12,
//     color: '#64748B',
//     textAlign: 'center',
//   },
//   logoutBtn: {
//     marginTop: 4,
//     marginBottom: 24,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(15, 23, 42, 0.6)',
//     justifyContent: 'flex-end',
//   },
//   modalCard: {
//     backgroundColor: '#FFFFFF',
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     padding: 20,
//     maxHeight: '90%',
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//     paddingBottom: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F1F5F9',
//   },
//   modalTitle: {
//     fontSize: 17,
//     fontWeight: '800',
//     color: '#0F172A',
//   },
//   closeBtnText: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#64748B',
//   },
//   errorBox: {
//     backgroundColor: '#FEF2F2',
//     padding: 10,
//     borderRadius: 8,
//     marginBottom: 12,
//   },
//   errorText: {
//     color: '#DC2626',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   avatarPickerRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   avatarPickerCircle: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: '#E0F2FE',
//     justifyContent: 'center',
//     alignItems: 'center',
//     overflow: 'hidden',
//     marginRight: 14,
//   },
//   avatarPickerImage: {
//     width: '100%',
//     height: '100%',
//   },
//   avatarPickerInitial: {
//     fontSize: 22,
//     fontWeight: '800',
//     color: '#0284C7',
//   },
//   uploadAvatarBtn: {
//     backgroundColor: '#F0F9FF',
//     borderWidth: 1,
//     borderColor: '#38BDF8',
//     paddingHorizontal: 14,
//     paddingVertical: 8,
//     borderRadius: 8,
//   },
//   uploadAvatarText: {
//     color: '#0284C7',
//     fontSize: 12,
//     fontWeight: '700',
//   },
//   fieldLabel: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: '#334155',
//     marginTop: 8,
//     marginBottom: 6,
//   },
//   imagePickerCard: {
//     marginBottom: 14,
//   },
//   pickerBox: {
//     borderWidth: 2,
//     borderColor: '#CBD5E1',
//     borderStyle: 'dashed',
//     borderRadius: 12,
//     padding: 14,
//     alignItems: 'center',
//     backgroundColor: '#F8FAFC',
//   },
//   pickerBoxTitle: {
//     fontSize: 13,
//     fontWeight: '800',
//     color: '#0284C7',
//   },
//   pickerBoxSub: {
//     fontSize: 11,
//     color: '#64748B',
//   },
//   previewContainer: {
//     borderRadius: 12,
//     overflow: 'hidden',
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//   },
//   licensePickerImage: {
//     width: '100%',
//     height: 140,
//   },
//   repickBtn: {
//     backgroundColor: '#0F172A',
//     paddingVertical: 8,
//     alignItems: 'center',
//   },
//   repickBtnText: {
//     color: '#FFFFFF',
//     fontSize: 12,
//     fontWeight: '700',
//   },
// });

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  container: {
    padding: 16,
  },

  /* ================= PROFILE HEADER ================= */

  profileHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },

  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FACC15',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
  },

  avatarInitial: {
    fontSize: 34,
    fontWeight: '800',
    color: '#A16207',
  },

  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },

  email: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
  },

  roleBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },

  roleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A16207',
    letterSpacing: 0.5,
  },

  /* ================= STATUS ================= */

  statusCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },

  pendingStatus: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FACC15',
  },

  approvedStatus: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
  },

  statusTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },

  statusSub: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 17,
  },

  /* ================= INFO CARDS ================= */

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },

  editLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A16207',
  },

  headerEditBtn: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },

  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },

  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
  },

  /* ================= LICENSE ================= */

  licensePreviewCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 4,
  },

  licenseImage: {
    width: '100%',
    height: 160,
  },

  licenseTag: {
    backgroundColor: '#10B981',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },

  licenseTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  uploadPlaceholderCard: {
    borderWidth: 2,
    borderColor: '#FACC15',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
  },

  uploadPlaceholderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#A16207',
    marginBottom: 2,
  },

  uploadPlaceholderSub: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },

  /* ================= LOGOUT ================= */

  logoutBtn: {
    marginTop: 4,
    marginBottom: 24,
  },

  /* ================= MODAL ================= */

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    justifyContent: 'flex-end',
  },

  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },

  closeBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
  },

  /* ================= ERROR ================= */

  errorBox: {
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },

  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },

  /* ================= AVATAR PICKER ================= */

  avatarPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  avatarPickerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 14,
  },

  avatarPickerImage: {
    width: '100%',
    height: '100%',
  },

  avatarPickerInitial: {
    fontSize: 22,
    fontWeight: '800',
    color: '#A16207',
  },

  uploadAvatarBtn: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FACC15',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },

  uploadAvatarText: {
    color: '#A16207',
    fontSize: 12,
    fontWeight: '700',
  },

  /* ================= FORM ================= */

  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 8,
    marginBottom: 6,
  },

  imagePickerCard: {
    marginBottom: 14,
  },

  pickerBox: {
    borderWidth: 2,
    borderColor: '#FACC15',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
  },

  pickerBoxTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#A16207',
  },

  pickerBoxSub: {
    fontSize: 11,
    color: '#6B7280',
  },

  previewContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  licensePickerImage: {
    width: '100%',
    height: 140,
  },

  repickBtn: {
    backgroundColor: '#111827',
    paddingVertical: 8,
    alignItems: 'center',
  },

  repickBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default ProfileScreen;
