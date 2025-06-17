export interface Market {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    address: string;
    hours?: {
      [key: string]: string;
    };
    isOpen?: boolean;
    vendors?: Vendor[];
    phone?: string;
    website?: string;
    acceptsSnap?: boolean;
    acceptsWic?: boolean;
    organicOnly?: boolean;
    petFriendly?: boolean;
  }
  
  export interface Vendor {
    id: string;
    name: string;
    specialty: string;
    contactInfo?: {
      phone?: string;
      email?: string;
    };
    description?: string;
  }
  
  export interface MarketPhoto {
    id: string;
    marketId: string;
    photoUrl: string;
    tags: string[];
    caption?: string;
    likesCount?: number;
    createdAt: string;
  }
  
  export interface MarketReview {
    id: string;
    marketId: string;
    rating: number;
    reviewText?: string;
    helpfulCount?: number;
    createdAt: string;
  }