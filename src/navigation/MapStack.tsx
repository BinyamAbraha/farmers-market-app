import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MapScreen from '../screens/MapScreen';
import MarketDetailScreen from '../screens/MarketDetailScreen';
import { MapStackParamList } from '../types/navigation';

const Stack = createStackNavigator<MapStackParamList>();

export default function MapStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Map"
        component={MapScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="MarketDetail"
        component={MarketDetailScreen}
        options={({ route }) => ({
          title: route.params.market.name,
          headerStyle: {
            backgroundColor: '#2E8B57',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
        })}
      />
    </Stack.Navigator>
  );
} 