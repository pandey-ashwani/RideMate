import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, Car, ClipboardList, Bell, User } from 'lucide-react-native';
import colors from '../theme/colors';

import OwnerDashboardScreen from '../screens/Owner/OwnerDashboardScreen';
import MyVehiclesScreen from '../screens/Owner/MyVehiclesScreen';
import BookingRequestsScreen from '../screens/Owner/BookingRequestsScreen';
import NotificationsScreen from '../screens/Customer/NotificationsScreen';
import ProfileScreen from '../screens/Customer/ProfileScreen';

const Tab = createBottomTabNavigator();

export const OwnerTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 56 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarIcon: ({ color, size, focused }) => {
          const iconSize = size || 22;
          const strokeWidth = focused ? 2.5 : 2;

          if (route.name === 'DashboardTab') return <LayoutDashboard size={iconSize} color={color} strokeWidth={strokeWidth} />;
          if (route.name === 'VehiclesTab') return <Car size={iconSize} color={color} strokeWidth={strokeWidth} />;
          if (route.name === 'RequestsTab') return <ClipboardList size={iconSize} color={color} strokeWidth={strokeWidth} />;
          if (route.name === 'NotificationsTab') return <Bell size={iconSize} color={color} strokeWidth={strokeWidth} />;
          if (route.name === 'ProfileTab') return <User size={iconSize} color={color} strokeWidth={strokeWidth} />;

          return <LayoutDashboard size={iconSize} color={color} strokeWidth={strokeWidth} />;
        },
      })}
    >
      <Tab.Screen name="DashboardTab" component={OwnerDashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />
      <Tab.Screen name="VehiclesTab" component={MyVehiclesScreen} options={{ tabBarLabel: 'My Fleet' }} />
      <Tab.Screen name="RequestsTab" component={BookingRequestsScreen} options={{ tabBarLabel: 'Requests' }} />
      <Tab.Screen name="NotificationsTab" component={NotificationsScreen} options={{ tabBarLabel: 'Alerts' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
};

export default OwnerTabNavigator;
