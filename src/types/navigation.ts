// src/types/navigation.ts

import { Market } from './index';
import { NavigatorScreenParams } from '@react-navigation/native';

export type DiscoverStackParamList = {
  DiscoverMain: undefined;
  MapView: undefined;
  MarketDetail: {
    market: Market;
  };
};

export type MapStackParamList = {
  MapMain: undefined;
  MarketDetail: {
    market: Market;
  };
};

export type ShareStackParamList = {
  ShareMain: undefined;
  PhotoCapture: undefined;
  PhotoEdit: {
    imageUri: string;
  };
};

export type CommunityStackParamList = {
  CommunityMain: undefined;
  MarketHaul: undefined;
  UserProfile: {
    userId: string;
  };
  PostDetail: {
    postId: string;
  };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  EditProfile: undefined;
  Favorites: undefined;
};

export type RootTabParamList = {
  Discover: NavigatorScreenParams<DiscoverStackParamList>;
  Map: NavigatorScreenParams<MapStackParamList>;
  Share: NavigatorScreenParams<ShareStackParamList>;
  Community: NavigatorScreenParams<CommunityStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

// Navigation prop types for screens
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';

// Discover Stack Navigation Props
export type DiscoverScreenNavigationProp = StackNavigationProp<DiscoverStackParamList, 'DiscoverMain'>;
export type MapScreenNavigationProp = StackNavigationProp<DiscoverStackParamList, 'MapView'>;

// Map Stack Navigation Props
export type MapMainScreenNavigationProp = StackNavigationProp<MapStackParamList, 'MapMain'>;

// Share Stack Navigation Props
export type ShareScreenNavigationProp = StackNavigationProp<ShareStackParamList, 'ShareMain'>;

// Community Stack Navigation Props
export type CommunityScreenNavigationProp = StackNavigationProp<CommunityStackParamList, 'CommunityMain'>;
export type PhotoHubScreenNavigationProp = StackNavigationProp<CommunityStackParamList, 'CommunityMain'>;
export type MarketHaulScreenNavigationProp = StackNavigationProp<CommunityStackParamList, 'MarketHaul'>;

// Profile Stack Navigation Props
export type ProfileScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

// Shared Market Detail Props
export type MarketDetailScreenNavigationProp = StackNavigationProp<DiscoverStackParamList | MapStackParamList, 'MarketDetail'>;
export type MarketDetailScreenRouteProp = RouteProp<DiscoverStackParamList | MapStackParamList, 'MarketDetail'>;

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