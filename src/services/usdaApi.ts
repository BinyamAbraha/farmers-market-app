const USDA_API_BASE_URL = 'https://www.usdalocalfoodportal.com/api/farmersmarket/';
const API_KEY = 'uHSPhDFPwW';

// Fallback mock data for testing and demonstration when API is unavailable
const MOCK_MARKETS_DATA: { [key: string]: USDAMarket[] } = {
  CA: [
    {
      listing_name: 'Santa Monica Farmers Market',
      location_state: 'CA',
      location_city: 'Santa Monica',
      location_zipcode: '90401',
      location_address: '1300 3rd Street Promenade',
      location_x: -118.4958,
      location_y: 34.0195,
      contact_phone: '(310) 458-8712',
      media_website: 'https://www.smgov.net/departments/ccs/farmers-market/',
      operation_hours: 'Wednesday: 8:30 AM - 1:30 PM, Saturday: 8:30 AM - 1:00 PM',
    },
    {
      listing_name: 'Ferry Building Marketplace',
      location_state: 'CA',
      location_city: 'San Francisco',
      location_zipcode: '94111',
      location_address: '1 Ferry Building',
      location_x: -122.3937,
      location_y: 37.7955,
      contact_phone: '(415) 983-8030',
      media_website: 'https://www.ferrybuildingmarketplace.com/',
      operation_hours: 'Tuesday: 10:00 AM - 2:00 PM, Thursday: 10:00 AM - 2:00 PM, Saturday: 8:00 AM - 2:00 PM',
    },
  ],
  NY: [
    {
      listing_name: 'Union Square Greenmarket',
      location_state: 'NY',
      location_city: 'New York',
      location_zipcode: '10003',
      location_address: 'Union Square Park',
      location_x: -73.9903,
      location_y: 40.7359,
      contact_phone: '(212) 788-7900',
      media_website: 'https://www.grownyc.org/greenmarket/',
      operation_hours: 'Monday, Wednesday, Friday, Saturday: 8:00 AM - 6:00 PM',
    },
    {
      listing_name: 'Grand Army Plaza Greenmarket',
      location_state: 'NY',
      location_city: 'Brooklyn',
      location_zipcode: '11238',
      location_address: 'Grand Army Plaza',
      location_x: -73.9696,
      location_y: 40.6743,
      contact_phone: '(212) 788-7900',
      media_website: 'https://www.grownyc.org/greenmarket/',
      operation_hours: 'Saturday: 8:00 AM - 4:00 PM',
    },
  ],
  TX: [
    {
      listing_name: 'Dallas Farmers Market',
      location_state: 'TX',
      location_city: 'Dallas',
      location_zipcode: '75226',
      location_address: '1010 S Pearl Expy',
      location_x: -96.7836,
      location_y: 32.7668,
      contact_phone: '(214) 939-2808',
      media_website: 'https://dallasfarmersmarket.org/',
      operation_hours: 'Saturday, Sunday: 9:00 AM - 5:00 PM',
    },
  ],
  FL: [
    {
      listing_name: 'South Beach Farmers Market',
      location_state: 'FL',
      location_city: 'Miami Beach',
      location_zipcode: '33139',
      location_address: '1100 Lincoln Rd',
      location_x: -80.1373,
      location_y: 25.7907,
      contact_phone: '(305) 531-0038',
      operation_hours: 'Sunday: 9:00 AM - 6:30 PM',
    },
  ],
  IL: [
    {
      listing_name: 'Green City Market',
      location_state: 'IL',
      location_city: 'Chicago',
      location_zipcode: '60614',
      location_address: '1750 N Clark St',
      location_x: -87.6298,
      location_y: 41.9128,
      contact_phone: '(773) 880-1266',
      media_website: 'https://www.greencitymarket.org/',
      operation_hours: 'Wednesday, Saturday: 7:00 AM - 1:00 PM',
    },
  ],
};

export interface USDAMarket {
  listing_name: string;
  media_website?: string;
  location_state: string;
  location_city: string;
  location_zipcode: string;
  location_address?: string;
  listing_desc?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  operation_hours?: string;
  operation_season?: string;
  location_x?: number;
  location_y?: number;
}

export interface USDAApiResponse {
  success: boolean;
  data: USDAMarket[];
  error?: string;
}

class USDAApiService {
  private useMockData = false; // Flag to track if we should use mock data
  
  private async makeRequest(queryParams: string): Promise<USDAApiResponse> {
    try {
      const url = `${USDA_API_BASE_URL}?apikey=${API_KEY}&${queryParams}`;
      console.log('🌐 Making USDA API request:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Raw API Response:', data);
      console.log('📊 Response type:', typeof data, 'Is array:', Array.isArray(data));
      
      // Handle different response formats
      let markets: USDAMarket[] = [];
      if (Array.isArray(data)) {
        markets = data;
      } else if (data && typeof data === 'object') {
        // Check for common response wrapper properties
        if (Array.isArray(data.results)) {
          markets = data.results;
        } else if (Array.isArray(data.data)) {
          markets = data.data;
        } else if (Array.isArray(data.markets)) {
          markets = data.markets;
        } else {
          console.warn('⚠️ Unexpected API response format:', data);
          markets = [];
        }
      }
      
      console.log(`🎯 Processed ${markets.length} markets from API response`);
      
      return {
        success: true,
        data: markets,
      };
    } catch (error) {
      console.error('💥 USDA API Error:', error);
      console.log('🔄 API failed, enabling mock data mode');
      this.useMockData = true;
      
      // Return error for now, fallback will be handled in specific methods
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getMarketsByState(state: string): Promise<USDAApiResponse> {
    console.log(`🏛️ Loading markets for state: ${state}`);
    
    // Try API first
    if (!this.useMockData) {
      const result = await this.makeRequest(`state=${state.toLowerCase()}`);
      if (result.success) {
        return result;
      }
      // If API fails, fall back to mock data
      console.log('🔄 API failed, using mock data for state:', state);
      this.useMockData = true;
    }
    
    // Use mock data
    const mockData = MOCK_MARKETS_DATA[state.toUpperCase()] || [];
    console.log(`📋 Using mock data: ${mockData.length} markets for ${state}`);
    
    return {
      success: true,
      data: mockData,
      error: mockData.length === 0 ? `No mock data available for ${state.toUpperCase()}` : 
        mockData.length > 0 ? `Using demo data for ${state.toUpperCase()} - USDA API unavailable` : undefined,
    };
  }

  async getMarketsByZip(zipcode: string): Promise<USDAApiResponse> {
    console.log(`📍 Loading markets for zip: ${zipcode}`);
    return this.makeRequest(`zip=${zipcode}`);
  }

  async getMarketsByZipAndRadius(zipcode: string, radius: number): Promise<USDAApiResponse> {
    const limitedRadius = Math.min(radius, 100);
    console.log(`📍 Loading markets for zip ${zipcode} within ${limitedRadius} miles`);
    return this.makeRequest(`zip=${zipcode}&radius=${limitedRadius}`);
  }

  async getMarketsByCoordinates(latitude: number, longitude: number, radius: number): Promise<USDAApiResponse> {
    const limitedRadius = Math.min(radius, 100);
    console.log(`🗺️ Loading markets near ${latitude}, ${longitude} within ${limitedRadius} miles`);
    
    // Try API first
    if (!this.useMockData) {
      const result = await this.makeRequest(`x=${longitude}&y=${latitude}&radius=${limitedRadius}`);
      if (result.success) {
        return result;
      }
      console.log('🔄 API failed for coordinates, using mock data based on location');
      this.useMockData = true;
    }
    
    // Use mock data - find markets near the coordinates
    const allMockMarkets = Object.values(MOCK_MARKETS_DATA).flat();
    const nearbyMarkets = allMockMarkets.filter(market => {
      if (!market.location_x || !market.location_y) return false;
      
      // Simple distance calculation (approximate)
      const latDiff = Math.abs(market.location_y - latitude);
      const lonDiff = Math.abs(market.location_x - longitude);
      const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
      
      // Rough conversion: 1 degree ≈ 69 miles
      return distance * 69 <= limitedRadius;
    });
    
    console.log(`📋 Using mock data: ${nearbyMarkets.length} markets near coordinates`);
    
    return {
      success: true,
      data: nearbyMarkets,
      error: nearbyMarkets.length === 0 ? 'No markets found near your location' : undefined,
    };
  }

  async getMarketsByCity(city: string, state: string): Promise<USDAApiResponse> {
    console.log(`🏙️ Loading markets for ${city}, ${state}`);
    return this.makeRequest(`city=${encodeURIComponent(city)}&state=${state.toLowerCase()}`);
  }

  // Helper method to determine states within a map region
  private getStatesInRegion(latitude: number, longitude: number, latitudeDelta: number, longitudeDelta: number): string[] {
    // Define approximate state boundaries (simplified)
    const stateBounds: { [key: string]: { minLat: number, maxLat: number, minLon: number, maxLon: number } } = {
      'CA': { minLat: 32.5, maxLat: 42.0, minLon: -124.5, maxLon: -114.1 },
      'NY': { minLat: 40.5, maxLat: 45.0, minLon: -79.8, maxLon: -71.8 },
      'TX': { minLat: 25.8, maxLat: 36.5, minLon: -106.6, maxLon: -93.5 },
      'FL': { minLat: 24.4, maxLat: 31.0, minLon: -87.6, maxLon: -80.0 },
      'IL': { minLat: 36.9, maxLat: 42.5, minLon: -91.5, maxLon: -87.0 },
    };

    const regionBounds = {
      minLat: latitude - latitudeDelta / 2,
      maxLat: latitude + latitudeDelta / 2,
      minLon: longitude - longitudeDelta / 2,
      maxLon: longitude + longitudeDelta / 2,
    };

    const statesInRegion: string[] = [];
    
    for (const [state, bounds] of Object.entries(stateBounds)) {
      // Check if state bounds overlap with region bounds
      if (bounds.maxLat >= regionBounds.minLat &&
          bounds.minLat <= regionBounds.maxLat &&
          bounds.maxLon >= regionBounds.minLon &&
          bounds.minLon <= regionBounds.maxLon) {
        statesInRegion.push(state);
      }
    }

    return statesInRegion;
  }

  // New method to load markets based on map region
  async getMarketsByRegion(latitude: number, longitude: number, latitudeDelta: number, longitudeDelta: number): Promise<USDAApiResponse> {
    console.log(`🗺️ Loading markets for region: ${latitude}, ${longitude} with delta ${latitudeDelta}, ${longitudeDelta}`);
    
    // If zoomed in close enough, use coordinate-based search
    if (latitudeDelta < 2 && longitudeDelta < 2) {
      const radius = Math.max(latitudeDelta, longitudeDelta) * 69; // Convert to miles approximately
      return this.getMarketsByCoordinates(latitude, longitude, Math.min(radius, 100));
    }
    
    // If zoomed out, load markets from states in the region
    const statesInRegion = this.getStatesInRegion(latitude, longitude, latitudeDelta, longitudeDelta);
    console.log(`📍 States in region: ${statesInRegion.join(', ')}`);
    
    if (statesInRegion.length === 0) {
      return {
        success: true,
        data: [],
        error: 'No states found in this region',
      };
    }
    
    // Load markets from all states in the region
    const allMarkets: USDAMarket[] = [];
    let hasError = false;
    let lastError = '';
    
    for (const state of statesInRegion) {
      try {
        const stateResult = await this.getMarketsByState(state);
        if (stateResult.success) {
          allMarkets.push(...stateResult.data);
        } else {
          hasError = true;
          lastError = stateResult.error || 'Unknown error';
        }
      } catch (error) {
        hasError = true;
        lastError = error instanceof Error ? error.message : 'Unknown error';
      }
    }
    
    console.log(`✅ Loaded ${allMarkets.length} markets from ${statesInRegion.length} states`);
    
    return {
      success: allMarkets.length > 0,
      data: allMarkets,
      error: allMarkets.length === 0 ? lastError || 'No markets found in region' : undefined,
    };
  }
}

export const usdaApiService = new USDAApiService();