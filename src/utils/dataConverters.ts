import { USDAMarket } from '../services/usdaApi';
import { Market, ensureMarketFormat } from '../types';
import SuperCluster from 'supercluster';

export function convertUSDAToMarket(usdaMarket: USDAMarket, index: number): Market {
  console.log(`🔄 Converting USDA market:`, usdaMarket.listing_name);
  
  // Generate a consistent ID
  const id = `usda_${usdaMarket.location_state}_${usdaMarket.location_zipcode}_${index}_${usdaMarket.listing_name.replace(/\s+/g, '_')}`;
  
  // Use provided coordinates or default to state center
  const latitude = usdaMarket.location_y || getDefaultLatitude(usdaMarket.location_state);
  const longitude = usdaMarket.location_x || getDefaultLongitude(usdaMarket.location_state);
  
  // Create full address
  const address = usdaMarket.location_address || 
    `${usdaMarket.location_city}, ${usdaMarket.location_state} ${usdaMarket.location_zipcode}`;
  
  // Parse hours (simplified to a string)
  const hours = usdaMarket.operation_hours || 'Hours not available';
  
  // Determine if market is open (simplified)
  const isOpen = determineMarketStatus(usdaMarket.operation_hours);
  
  const convertedMarket: Market = {
    id,
    name: usdaMarket.listing_name,
    latitude,
    longitude,
    coordinate: {
      latitude,
      longitude,
    },
    address,
    hours,
    isOpen,
    phone: usdaMarket.contact_phone,
    website: usdaMarket.media_website,
    // Set defaults for features we don't have data for
    acceptsSnap: false,
    acceptsWic: false,
    organicOnly: false,
    petFriendly: false,
  };
  
  console.log(`✅ Converted market: ${convertedMarket.name} at ${convertedMarket.latitude}, ${convertedMarket.longitude}`);
  return convertedMarket;
}

// Default coordinates for states (center points)
function getDefaultLatitude(state: string): number {
  const stateCoords: { [key: string]: number } = {
    'CA': 36.7783, 'TX': 31.9686, 'FL': 27.7663, 'NY': 40.7589,
    'PA': 41.2033, 'IL': 40.3363, 'OH': 40.3888, 'GA': 33.7490,
    'NC': 35.5951, 'MI': 42.3314, 'NJ': 40.0583, 'VA': 37.7693,
    'WA': 47.0379, 'AZ': 33.7712, 'MA': 42.2373, 'TN': 35.7796,
    'IN': 39.8647, 'MO': 38.4623, 'MD': 39.0550, 'WI': 44.2563,
    'CO': 39.0598, 'MN': 45.7326, 'SC': 33.8191, 'AL': 32.3617,
  };
  return stateCoords[state.toUpperCase()] || 39.8283;
}

function getDefaultLongitude(state: string): number {
  const stateCoords: { [key: string]: number } = {
    'CA': -119.4179, 'TX': -99.9018, 'FL': -82.8001, 'NY': -74.0060,
    'PA': -77.1945, 'IL': -89.0022, 'OH': -82.7649, 'GA': -84.3880,
    'NC': -79.0193, 'MI': -84.5467, 'NJ': -74.7429, 'VA': -78.1690,
    'WA': -120.5542, 'AZ': -111.3877, 'MA': -71.5314, 'TN': -86.6892,
    'IN': -86.2604, 'MO': -92.3020, 'MD': -76.7909, 'WI': -89.6385,
    'CO': -105.3111, 'MN': -93.9196, 'SC': -80.8964, 'AL': -86.7911,
  };
  return stateCoords[state.toUpperCase()] || -98.5795;
}

function parseOperationHours(hours?: string): { [key: string]: string } {
  if (!hours) {
    return {
      'Monday': 'Hours not available',
      'Tuesday': 'Hours not available',
      'Wednesday': 'Hours not available',
      'Thursday': 'Hours not available',
      'Friday': 'Hours not available',
      'Saturday': 'Hours not available',
      'Sunday': 'Hours not available',
    };
  }
  
  // Return simplified hours for now
  return {
    'Saturday': hours,
    'Sunday': hours,
    'Monday': 'Check website for hours',
    'Tuesday': 'Check website for hours',
    'Wednesday': 'Check website for hours',
    'Thursday': 'Check website for hours',
    'Friday': 'Check website for hours',
  };
}

function determineMarketStatus(hours?: string): boolean {
  // Simple logic: assume markets are open during weekends
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  return dayOfWeek === 0 || dayOfWeek === 6;
}

const cluster = new SuperCluster({
  radius: 60,
  maxZoom: 16,
  minZoom: 1,
  extent: 512,
  nodeSize: 64,
});