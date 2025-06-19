// src/types/navigation.ts

import { Market } from './index';
import { NavigatorScreenParams } from '@react-navigation/native';

export type MapStackParamList = {
  Map: undefined;
  MarketDetail: {
    market: Market;
  };
};

export type RootTabParamList = {
  Map: NavigatorScreenParams<MapStackParamList>;
  Community: undefined;
  Profile: undefined;
};

// Navigation prop types for screens
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';

// Map Stack Navigation Props
export type MapScreenNavigationProp = StackNavigationProp<MapStackParamList, 'Map'>;
export type MarketDetailScreenNavigationProp = StackNavigationProp<MapStackParamList, 'MarketDetail'>;
export type MarketDetailScreenRouteProp = RouteProp<MapStackParamList, 'MarketDetail'>;

// Tab Navigation Props
export type ProfileScreenNavigationProp = BottomTabNavigationProp<RootTabParamList, 'Profile'>;

// Combined navigation prop types for screens that need both
export interface MapScreenProps {
  navigation: MapScreenNavigationProp;
}

export interface MarketDetailScreenProps {
  navigation: MarketDetailScreenNavigationProp;
  route: MarketDetailScreenRouteProp;
}

export interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}