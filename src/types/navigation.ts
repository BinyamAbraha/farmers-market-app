import { StackNavigationProp } from '@react-navigation/stack';

export type RootStackParamList = {
  Map: undefined;
  MarketDetail: {
    market: {
      id: number;
      name: string;
      coordinate: {
        latitude: number;
        longitude: number;
      };
      hours: string;
      distance: string;
      organic: boolean;
      acceptsSnap: boolean;
      petFriendly: boolean;
      address: string;
      fullHours: string;
      isOpen: boolean;
      phone?: string;
      website?: string;
    };
  };
};

export type MapScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Map'>;
export type MarketDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MarketDetail'>; 