import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import colors from '../theme/colors';

import AuthNavigator from './AuthNavigator';
import CustomerTabNavigator from './CustomerTabNavigator';
import OwnerTabNavigator from './OwnerTabNavigator';

import VehicleDetailsScreen from '../screens/Customer/VehicleDetailsScreen';
import BookingConfirmationScreen from '../screens/Customer/BookingConfirmationScreen';
import AddEditVehicleScreen from '../screens/Owner/AddEditVehicleScreen';
import OTPVerificationScreen from '../screens/Auth/OTPVerificationScreen';

const Stack = createStackNavigator();

export const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primaryDark} />
      </View>
    );
  }

  const isOwner = user && user.role === 'owner';
  const isUnverified = user && user.role !== 'admin' && !user.emailVerified && !user.phoneVerified;

  const authKey = user
    ? `${user._id || user.id || 'user'}-${user.role || 'guest'}-${user.emailVerified ? 'verified' : 'unverified'}`
    : 'guest';

  return (
    <NavigationContainer key={authKey}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isUnverified ? (
          // Unverified user forced into OTP Verification
          <Stack.Screen
            name="OTPVerification"
            component={OTPVerificationScreen}
            initialParams={{ email: user.email, role: user.role }}
          />
        ) : isOwner ? (
          // Owner Flow
          <>
            <Stack.Screen name="OwnerTabs" component={OwnerTabNavigator} />
            <Stack.Screen name="AddEditVehicle" component={AddEditVehicleScreen} />
            <Stack.Screen name="Auth" component={AuthNavigator} />
          </>
        ) : (
          // Default Guest & Customer Flow (Opens Home Page First!)
          <>
            <Stack.Screen name="MainTabs" component={CustomerTabNavigator} />
            <Stack.Screen name="VehicleDetails" component={VehicleDetailsScreen} />
            <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
            <Stack.Screen name="Auth" component={AuthNavigator} />
            <Stack.Screen name="OwnerTabs" component={OwnerTabNavigator} />
            <Stack.Screen name="AddEditVehicle" component={AddEditVehicleScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

export default AppNavigator;
