import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import MapScreen from './src/screens/MapScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import ShareScreen from './src/screens/ShareScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import MarketDetailScreen from './src/screens/MarketDetailScreen';
import VendorProfileScreen from './src/screens/VendorProfileScreen';
import PhotoHubScreen from './src/screens/PhotoHubScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MarketHaulScreen from './src/screens/MarketHaulScreen';
import LaunchScreen from './src/components/LaunchScreen';
import CustomTabBar from './src/components/CustomTabBar';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Discover Stack (content-first feed)
function DiscoverStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DiscoverMain"
        component={ExploreScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="MapView"
        component={MapScreen}
        options={{
          title: 'Map View',
          headerStyle: {
            backgroundColor: '#2E8B57',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <Stack.Screen
        name="MarketDetail"
        component={MarketDetailScreen}
        options={{
          title: 'Market Details',
          headerStyle: {
            backgroundColor: '#2E8B57',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <Stack.Screen
        name="VendorProfile"
        component={VendorProfileScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

// Map Stack (dedicated map utility)
function MapStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MapMain"
        component={MapScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="MarketDetail"
        component={MarketDetailScreen}
        options={{
          title: 'Market Details',
          headerStyle: {
            backgroundColor: '#2E8B57',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
    </Stack.Navigator>
  );
}

// Share Stack (photo capture and sharing)
function ShareStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ShareMain"
        component={ShareScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

// Community Stack (social features)
function CommunityStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CommunityMain"
        component={CommunityScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="MarketHaul"
        component={MarketHaulScreen}
        options={{
          title: 'Market Community',
          headerStyle: {
            backgroundColor: '#2E8B57',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
    </Stack.Navigator>
  );
}

// Profile Stack (user hub)
function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Discover"
    >
      <Tab.Screen
        name="Discover"
        component={DiscoverStack}
        options={{
          tabBarLabel: 'Discover',
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapStack}
        options={{
          tabBarLabel: 'Map',
        }}
      />
      <Tab.Screen
        name="Share"
        component={ShareStack}
        options={{
          tabBarLabel: 'Share',
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityStack}
        options={{
          tabBarLabel: 'Community',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [showLaunchScreen, setShowLaunchScreen] = useState(true);
  const [skipAnimation, setSkipAnimation] = useState(false);

  useEffect(() => {
    // Check if we should skip animation in development
    if (__DEV__ && Constants.expoConfig?.extra?.skipLaunchAnimation) {
      setSkipAnimation(true);
      setShowLaunchScreen(false);
    }
  }, []);

  const handleLaunchComplete = () => {
    setShowLaunchScreen(false);
  };

  if (showLaunchScreen && !skipAnimation) {
    return (
      <SafeAreaProvider>
        <LaunchScreen onAnimationComplete={handleLaunchComplete} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <MainTabNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}