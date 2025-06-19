// src/types/index.ts

// Core market data from USDA API
export interface USDAMarketData {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    address: string;
    hours?: string;
    isOpen?: boolean;
    organicOnly?: boolean;
    acceptsSnap?: boolean;
    acceptsWic?: boolean;
    petFriendly?: boolean;
    phone?: string;
    website?: string;
  }
  
  // Extended market data for app usage
  export interface Market extends USDAMarketData {
    // Required coordinate property for react-native-maps
    coordinate: {
      latitude: number;
      longitude: number;
    };
    
    // Optional properties that may be added by the app
    distance?: number;
    isFavorite?: boolean;
    vendors?: Vendor[];
    reviews?: Review[];
    heroImage?: string;
    
    // Additional properties that might be missing
    city?: string;
    state?: string;
    zipCode?: string;
    description?: string;
  }
  
  export interface Vendor {
    id: string;
    name: string;
    description?: string;
    products?: string[];
    imageUrl?: string;
  }
  
  export interface Review {
    id: string;
    rating: number;
    comment: string;
    author: string;
    date: string;
    helpful?: number;
  }
  
  // Filter types
  export type FilterType = 'organic' | 'acceptsSnap' | 'petFriendly';
  
  // Helper function to convert USDA data to app format
  export const convertUSDAToMarket = (usdaData: USDAMarketData): Market => ({
    ...usdaData,
    coordinate: {
      latitude: usdaData.latitude,
      longitude: usdaData.longitude,
    },
    isFavorite: false, // Will be set by favorites hook
  });
  
  // Type guard to check if an object is a valid Market
  export const isMarket = (obj: any): obj is Market => {
    return (
      obj &&
      typeof obj.id === 'string' &&
      typeof obj.name === 'string' &&
      typeof obj.latitude === 'number' &&
      typeof obj.longitude === 'number' &&
      obj.coordinate &&
      typeof obj.coordinate.latitude === 'number' &&
      typeof obj.coordinate.longitude === 'number'
    );
  };
  
  // Safe market converter that ensures all required properties
  export const ensureMarketFormat = (data: Partial<Market>): Market => {
    const latitude = data.latitude || data.coordinate?.latitude || 0;
    const longitude = data.longitude || data.coordinate?.longitude || 0;
    
    return {
      id: data.id || '',
      name: data.name || 'Unknown Market',
      latitude,
      longitude,
      address: data.address || '',
      coordinate: {
        latitude,
        longitude,
      },
      hours: data.hours,
      isOpen: data.isOpen,
      organicOnly: data.organicOnly || false,
      acceptsSnap: data.acceptsSnap || false,
      acceptsWic: data.acceptsWic || false,
      petFriendly: data.petFriendly || false,
      phone: data.phone,
      website: data.website,
      distance: data.distance,
      isFavorite: data.isFavorite || false,
      vendors: data.vendors || [],
      reviews: data.reviews || [],
      heroImage: data.heroImage,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      description: data.description,
    };
  };