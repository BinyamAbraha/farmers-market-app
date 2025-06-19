import { useState, useEffect, useCallback, useRef } from 'react';
import { Market } from '../types';
import { usdaApiService, USDAMarket } from '../services/usdaApi';
import { convertUSDAToMarket } from '../utils/dataConverters';

interface UseMarketDataResult {
  markets: Market[];
  loading: boolean;
  error: string | null;
  refreshMarkets: () => Promise<void>;
  loadMarketsByState: (state: string) => Promise<void>;
  loadMarketsByLocation: (latitude: number, longitude: number, radius?: number) => Promise<void>;
  loadMarketsByZip: (zipcode: string, radius?: number) => Promise<void>;
  loadMarketsByRegion: (latitude: number, longitude: number, latitudeDelta: number, longitudeDelta: number) => Promise<void>;
}

export const useMarketData = (): UseMarketDataResult => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const marketCacheRef = useRef<{ [key: string]: Market[] }>({});

  const processUSDAData = (usdaMarkets: USDAMarket[]): Market[] => {
    console.log(`🔄 Converting ${usdaMarkets.length} USDA markets to app format`);
    
    if (!Array.isArray(usdaMarkets) || usdaMarkets.length === 0) {
      console.warn('⚠️ No valid USDA markets to convert');
      return [];
    }
    
    // Process all markets without limiting
    const limitedMarkets = usdaMarkets;
    
    const converted = limitedMarkets.map((usdaMarket, index) => {
      try {
        return convertUSDAToMarket(usdaMarket, index);
      } catch (conversionError) {
        console.error(`❌ Error converting market ${index}:`, conversionError);
        return null;
      }
    }).filter((market): market is Market => market !== null);
    
    console.log(`✅ Successfully converted ${converted.length} markets`);
    return converted;
  };

  const loadMarketsByState = useCallback(async (state: string) => {
    console.log(`🚀 Starting to load markets for state: ${state}`);
    setLoading(true);
    setError(null);
    
    try {
      const response = await usdaApiService.getMarketsByState(state);
      console.log(`📡 API response for ${state}:`, response);
      
      if (response.success) {
        const convertedMarkets = processUSDAData(response.data);
        setMarkets(convertedMarkets);
        console.log(`✅ Successfully loaded ${convertedMarkets.length} markets for ${state}`);
        
        if (convertedMarkets.length === 0) {
          setError(`No markets found for ${state.toUpperCase()}`);
        }
      } else {
        console.error(`❌ API request failed for ${state}:`, response.error);
        setError(response.error || `Failed to load markets for ${state}`);
      }
    } catch (err) {
      console.error(`💥 Error loading markets for ${state}:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since this function doesn't depend on external state

  const loadMarketsByLocation = useCallback(async (latitude: number, longitude: number, radius: number = 50) => {
    console.log(`🚀 Starting to load markets near ${latitude}, ${longitude} within ${radius} miles`);
    setLoading(true);
    setError(null);
    
    try {
      const response = await usdaApiService.getMarketsByCoordinates(latitude, longitude, radius);
      console.log(`📡 API response for location:`, response);
      
      if (response.success) {
        const convertedMarkets = processUSDAData(response.data);
        setMarkets(convertedMarkets);
        console.log(`✅ Successfully loaded ${convertedMarkets.length} markets near location`);
        
        if (convertedMarkets.length === 0) {
          setError('No markets found near your location');
        }
      } else {
        console.error(`❌ API request failed for location:`, response.error);
        setError(response.error || 'Failed to load markets near location');
      }
    } catch (err) {
      console.error(`💥 Error loading markets near location:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMarketsByZip = useCallback(async (zipcode: string, radius: number = 30) => {
    console.log(`🚀 Starting to load markets near zip ${zipcode}`);
    setLoading(true);
    setError(null);
    
    try {
      const response = await usdaApiService.getMarketsByZipAndRadius(zipcode, radius);
      console.log(`📡 API response for zip ${zipcode}:`, response);
      
      if (response.success) {
        const convertedMarkets = processUSDAData(response.data);
        setMarkets(convertedMarkets);
        console.log(`✅ Successfully loaded ${convertedMarkets.length} markets near ${zipcode}`);
        
        if (convertedMarkets.length === 0) {
          setError(`No markets found near ${zipcode}`);
        }
      } else {
        console.error(`❌ API request failed for zip ${zipcode}:`, response.error);
        setError(response.error || `Failed to load markets near ${zipcode}`);
      }
    } catch (err) {
      console.error(`💥 Error loading markets near ${zipcode}:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMarketsByRegion = useCallback(async (latitude: number, longitude: number, latitudeDelta: number, longitudeDelta: number) => {
    console.log(`🚀 Starting to load markets for region: ${latitude}, ${longitude} with deltas ${latitudeDelta}, ${longitudeDelta}`);
    setLoading(true);
    setError(null);
    
    try {
      const response = await usdaApiService.getMarketsByRegion(latitude, longitude, latitudeDelta, longitudeDelta);
      console.log(`📡 API response for region:`, response);
      
      if (response.success) {
        const convertedMarkets = processUSDAData(response.data);
        setMarkets(convertedMarkets);
        console.log(`✅ Successfully loaded ${convertedMarkets.length} markets for region`);
        
        if (convertedMarkets.length === 0) {
          setError('No markets found in this region');
        }
      } else {
        console.error(`❌ API request failed for region:`, response.error);
        setError(response.error || 'Failed to load markets for region');
      }
    } catch (err) {
      console.error(`💥 Error loading markets for region:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshMarkets = async () => {
    console.log(`🔄 Refreshing markets - loading CA as default`);
    await loadMarketsByState('CA');
  };

  // Load initial data on mount
  useEffect(() => {
    console.log(`🎬 useMarketData hook initialized, loading CA markets on mount`);
    loadMarketsByState('CA');
  }, []);

  return {
    markets,
    loading,
    error,
    refreshMarkets,
    loadMarketsByState,
    loadMarketsByLocation,
    loadMarketsByZip,
    loadMarketsByRegion,
  };
};