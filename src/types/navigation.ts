// src/types/navigation.ts

import { Market } from './index';
import { NavigatorScreenParams } from '@react-navigation/native';

export type ExploreStackParamList = {
  ExploreMain: undefined;
  MarketDetail: {
    market: Market;
  };
};

export type CommunityStackParamList = {
  CommunityMain: undefined;
  MarketHaul: undefined;
};

export type RootTabParamList = {
  Explore: NavigatorScreenParams<ExploreStackParamList>;
  Community: NavigatorScreenParams<CommunityStackParamList>;
  MyLists: undefined;
  Profile: undefined;
};

// Navigation prop types for screens
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';

// Explore Stack Navigation Props
export type MapScreenNavigationProp = StackNavigationProp<ExploreStackParamList, 'ExploreMain'>;
export type MarketDetailScreenNavigationProp = StackNavigationProp<ExploreStackParamList, 'MarketDetail'>;
export type MarketDetailScreenRouteProp = RouteProp<ExploreStackParamList, 'MarketDetail'>;

// Community Stack Navigation Props
export type PhotoHubScreenNavigationProp = StackNavigationProp<CommunityStackParamList, 'CommunityMain'>;
export type MarketHaulScreenNavigationProp = StackNavigationProp<CommunityStackParamList, 'MarketHaul'>;

// Tab Navigation Props
export type ProfileScreenNavigationProp = BottomTabNavigationProp<RootTabParamList, 'Profile'>;
export type ListsScreenNavigationProp = BottomTabNavigationProp<RootTabParamList, 'MyLists'>;

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

export interface PhotoHubScreenProps {
  navigation: PhotoHubScreenNavigationProp;
}

export interface ListsScreenProps {
  navigation: ListsScreenNavigationProp;
}