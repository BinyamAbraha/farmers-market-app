import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import MapStack from './src/navigation/MapStack';
import CommunityScreen from './src/screens/CommunityScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Map') {
              iconName = focused ? 'map' : 'map-outline';
            } else if (route.name === 'Community') {
              iconName = focused ? 'people' : 'people-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            } else {
              iconName = 'help-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#2E8B57',
          tabBarInactiveTintColor: 'gray',
          headerStyle: {
            backgroundColor: '#2E8B57',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen 
          name="Map" 
          component={MapStack} 
          options={{ title: 'Farmers Markets' }}
        />
        <Tab.Screen 
          name="Community" 
          component={CommunityScreen} 
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen} 
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}