import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import MapScreen from './src/screens/MapScreen';
import MarketDetailScreen from './src/screens/MarketDetailScreen';
import PhotoHubScreen from './src/screens/PhotoHubScreen';
import ListsScreen from './src/screens/ListsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MarketHaulScreen from './src/screens/MarketHaulScreen';
import LaunchScreen from './src/components/LaunchScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Explore Stack (formerly Map Stack)
function ExploreStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ExploreMain"
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

// Community Stack
function CommunityStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CommunityMain"
        component={PhotoHubScreen}
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

function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;
            
            switch (route.name) {
              case 'Explore':
                iconName = focused ? 'map' : 'map-outline';
                break;
              case 'Community':
                iconName = focused ? 'camera' : 'camera-outline';
                break;
              case 'MyLists':
                iconName = focused ? 'list' : 'list-outline';
                break;
              case 'Profile':
                iconName = focused ? 'person' : 'person-outline';
                break;
              default:
                iconName = 'help-outline';
            }
            
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#2E8B57',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#f0f0f0',
            paddingBottom: Math.max(insets.bottom, 20), // Dynamic safe area with minimum
            paddingTop: 8,
            height: Math.max(60 + insets.bottom, 80), // Dynamic height based on safe area
            position: 'absolute',
            bottom: 0,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginBottom: 3,
          },
          headerStyle: {
            backgroundColor: '#2E8B57',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
        })}
      >
        <Tab.Screen
          name="Explore"
          options={{
            title: '🗺️ Explore',
            headerShown: false,
          }}
        >
          {() => <ExploreStack />}
        </Tab.Screen>
        <Tab.Screen
          name="Community"
          options={{
            title: '📸 Community',
            headerShown: false,
          }}
        >
          {() => <CommunityStack />}
        </Tab.Screen>
        <Tab.Screen
          name="MyLists"
          options={{
            title: '📋 My Lists',
            headerTitle: 'My Lists',
          }}
        >
          {() => <ListsScreen />}
        </Tab.Screen>
        <Tab.Screen
          name="Profile"
          options={{
            title: '👤 Profile',
            headerTitle: 'Profile',
          }}
        >
          {() => <ProfileScreen />}
        </Tab.Screen>
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