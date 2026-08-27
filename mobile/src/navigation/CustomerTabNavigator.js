import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, Search, Bike, Bell, User } from 'lucide-react-native';

import HomeScreen from '../screens/Customer/HomeScreen';
import VehicleSearchScreen from '../screens/Customer/VehicleSearchScreen';
import MyBookingsScreen from '../screens/Customer/MyBookingsScreen';
import NotificationsScreen from '../screens/Customer/NotificationsScreen';
import ProfileScreen from '../screens/Customer/ProfileScreen';

const Tab = createBottomTabNavigator();

export const CustomerTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#0284C7',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
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

          if (route.name === 'HomeTab') return <House size={iconSize} color={color} strokeWidth={strokeWidth} />;
          if (route.name === 'SearchTab') return <Search size={iconSize} color={color} strokeWidth={strokeWidth} />;
          if (route.name === 'BookingsTab') return <Bike size={iconSize} color={color} strokeWidth={strokeWidth} />;
          if (route.name === 'NotificationsTab') return <Bell size={iconSize} color={color} strokeWidth={strokeWidth} />;
          if (route.name === 'ProfileTab') return <User size={iconSize} color={color} strokeWidth={strokeWidth} />;

          return <House size={iconSize} color={color} strokeWidth={strokeWidth} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="SearchTab" component={VehicleSearchScreen} options={{ tabBarLabel: 'Search' }} />
      <Tab.Screen name="BookingsTab" component={MyBookingsScreen} options={{ tabBarLabel: 'Bookings' }} />
      <Tab.Screen name="NotificationsTab" component={NotificationsScreen} options={{ tabBarLabel: 'Alerts' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
};

export default CustomerTabNavigator;
