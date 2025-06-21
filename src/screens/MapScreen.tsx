import React, { useState, useMemo, useRef, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { MapScreenNavigationProp } from '../types/navigation';
import { openMapsApp, makePhoneCall } from '../utils/deviceActions';
import { useFavorites } from '../hooks/useFavorites';
import { useMarketData } from '../hooks/useMarketData';
import { marketService, Market as SupabaseMarket } from '../services/supabase';
import ClusteredMapView from '../components/ClusteredMapView';
import MarketCard, { MarketCardData } from '../components/MarketCard';
import FilterChip, { FilterOption } from '../components/FilterChip';
import ExpandableBottomSheet from '../components/ExpandableBottomSheet';

const { height: screenHeight } = Dimensions.get('window');

type FilterType = 'organic' | 'snap' | 'petFriendly' | 'openNow' | 'favorites';

const FILTER_OPTIONS: FilterOption[] = [
  { key: 'organic', label: 'Organic', icon: 'leaf' },
  { key: 'snap', label: 'SNAP/WIC', icon: 'card' },
  { key: 'petFriendly', label: 'Pet Friendly', icon: 'paw' },
  { key: 'openNow', label: 'Open Now', icon: 'time' },
  { key: 'favorites', label: 'Favorites Only', icon: 'heart' },
];

const MapScreen = memo(() => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterType[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [dataSource, setDataSource] = useState<'supabase' | 'usda'>('supabase');
  const [supabaseMarkets, setSupabaseMarkets] = useState<SupabaseMarket[]>([]);
  const [isLoadingSupabase, setIsLoadingSupabase] = useState(false);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);
  
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.7749, // San Francisco center
    longitude: -122.4194,
    latitudeDelta: 0.1, // Closer zoom to see sample markets
    longitudeDelta: 0.1,
  });

  const mapRef = useRef<MapView>(null);
  const navigation = useNavigation<MapScreenNavigationProp>();
  const { favorites, toggleFavorite, checkIsFavorite } = useFavorites();
  
  // USDA API Integration
  const { 
    markets, 
    loading, 
    loadMarketsByRegion
  } = useMarketData();

  // Transform Supabase Market to display format
  const transformSupabaseMarket = (supabaseMarket: SupabaseMarket): MarketCardData => ({
    id: supabaseMarket.id,
    name: supabaseMarket.name,
    address: supabaseMarket.address || '',
    phone: supabaseMarket.phone || '',
    coordinate: {
      latitude: supabaseMarket.latitude,
      longitude: supabaseMarket.longitude,
    },
    isOpen: true, // TODO: Calculate based on hours
    rating: 4.5, // TODO: Get from reviews
    distance: userLocation ? calculateDistance(
      userLocation.coords.latitude,
      userLocation.coords.longitude,
      supabaseMarket.latitude,
      supabaseMarket.longitude
    ) : undefined,
    organic: supabaseMarket.organic_only,
    acceptsSnap: supabaseMarket.accepts_snap,
    petFriendly: supabaseMarket.pet_friendly,
  });

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): string => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return `${distance.toFixed(1)} mi`;
  };

  // Load markets from Supabase
  const loadSupabaseMarkets = async () => {
    try {
      setIsLoadingSupabase(true);
      const supabaseData = await marketService.getAllMarkets();
      setSupabaseMarkets(supabaseData);
      return supabaseData;
    } catch (error) {
      console.error('Supabase error:', error);
      // Fall back to USDA API
      await loadMarketsByRegion(
        mapRegion.latitude,
        mapRegion.longitude,
        mapRegion.latitudeDelta,
        mapRegion.longitudeDelta
      );
      throw error;
    } finally {
      setIsLoadingSupabase(false);
    }
  };

  // Sample markets for testing when no data is loaded
  const sampleMarkets = useMemo(() => [
    {
      id: 'sample-1',
      name: 'Central Farmers Market',
      address: '123 Main St, San Francisco, CA',
      phone: '(555) 123-4567',
      coordinate: { latitude: 37.7749, longitude: -122.4194 },
      isOpen: true,
      rating: 4.5,
      organic: true,
      acceptsSnap: true,
      petFriendly: false,
    },
    {
      id: 'sample-2', 
      name: 'Pier 39 Farmers Market',
      address: 'Pier 39, San Francisco, CA',
      phone: '(555) 987-6543',
      coordinate: { latitude: 37.8085, longitude: -122.4097 },
      isOpen: true,
      rating: 4.8,
      organic: false,
      acceptsSnap: true,
      petFriendly: true,
    },
    {
      id: 'sample-3',
      name: 'Mission District Market',
      address: '456 Mission St, San Francisco, CA', 
      phone: '(555) 555-0123',
      coordinate: { latitude: 37.7599, longitude: -122.4148 },
      isOpen: false,
      rating: 4.2,
      organic: true,
      acceptsSnap: false,
      petFriendly: true,
    }
  ], []);

  // Get current markets based on data source
  const currentMarkets = useMemo(() => {
    let marketData: MarketCardData[] = [];
    
    if (dataSource === 'supabase' && supabaseMarkets.length > 0) {
      marketData = supabaseMarkets.map(transformSupabaseMarket);
    } else if (markets.length > 0) {
      marketData = markets.map(market => ({
        id: market.id,
        name: market.name,
        address: market.address,
        phone: market.phone,
        coordinate: market.coordinate || { latitude: market.latitude, longitude: market.longitude },
        isOpen: market.isOpen || true,
        rating: 4.5,
        distance: userLocation ? calculateDistance(
          userLocation.coords.latitude,
          userLocation.coords.longitude,
          market.latitude,
          market.longitude
        ) : undefined,
        organic: market.organicOnly,
        acceptsSnap: market.acceptsSnap,
        petFriendly: market.petFriendly,
      }));
    } else {
      // Use sample data when no markets are loaded
      marketData = sampleMarkets;
      // Using sample markets for demo
    }
    
    // Current markets loaded
    return marketData;
  }, [dataSource, supabaseMarkets, markets, userLocation, sampleMarkets, transformSupabaseMarket, calculateDistance]);

  // Filter markets based on search query and active filters
  const filteredMarkets = useMemo(() => {
    let filtered = currentMarkets;
    // Filtering markets
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(market => 
        market.name.toLowerCase().includes(query) ||
        market.address.toLowerCase().includes(query)
      );
      // After search filter
    }
    
    // Feature filters
    if (activeFilters.length > 0) {
      filtered = filtered.filter(market => 
        activeFilters.every(filter => {
          switch (filter) {
            case 'organic':
              return market.organic;
            case 'snap':
              return market.acceptsSnap;
            case 'petFriendly':
              return market.petFriendly;
            case 'openNow':
              return market.isOpen;
            case 'favorites':
              return checkIsFavorite(market.id.toString());
            default:
              return true;
          }
        })
      );
      // After feature filters
    }
    
    // Final filtered markets
    return filtered;
  }, [currentMarkets, searchQuery, activeFilters, favorites, checkIsFavorite]);

  // Get user location
  const getUserLocation = async () => {
    try {
      setIsLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to find nearby markets');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
      
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      };
      
      setMapRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
      
      // Load markets for this location
      await loadSupabaseMarkets();
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Failed to get your location');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Handle filter toggle
  const handleFilterToggle = (filterKey: string) => {
    const filter = filterKey as FilterType;
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  // Handle market selection
  const handleMarketPress = (market: MarketCardData) => {
    const marketForNavigation = {
      id: market.id.toString(),
      name: market.name,
      address: market.address,
      phone: market.phone || '',
      website: '',
      hours: '',
      fullHours: '',
      organic: market.organic || false,
      acceptsSnap: market.acceptsSnap || false,
      petFriendly: market.petFriendly || false,
      isOpen: market.isOpen,
      latitude: market.coordinate.latitude,
      longitude: market.coordinate.longitude,
      coordinate: market.coordinate,
    };
    
    navigation.navigate('MarketDetail', { market: marketForNavigation });
  };

  // Handle quick actions
  const handleCall = async (market: MarketCardData) => {
    if (market.phone) {
      await makePhoneCall(market.phone);
    }
  };

  const handleDirections = async (market: MarketCardData) => {
    await openMapsApp(
      market.coordinate.latitude,
      market.coordinate.longitude,
      market.name
    );
  };

  const handleFavorite = (market: MarketCardData) => {
    toggleFavorite(market.id.toString());
  };

  // Initialize
  useEffect(() => {
    loadSupabaseMarkets();
  }, []);

  // Render search bar
  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search markets..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        style={styles.locationButton}
        onPress={getUserLocation}
        disabled={isLoadingLocation}
      >
        {isLoadingLocation ? (
          <ActivityIndicator size="small" color="#2E8B57" />
        ) : (
          <Ionicons name="locate" size={20} color="#2E8B57" />
        )}
      </TouchableOpacity>
    </View>
  );

  // Render filter chips
  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersList}
      >
        {FILTER_OPTIONS.map((filter) => (
          <FilterChip
            key={filter.key}
            filter={{
              ...filter,
              count: activeFilters.includes(filter.key as FilterType) 
                ? filteredMarkets.length 
                : undefined
            }}
            isSelected={activeFilters.includes(filter.key as FilterType)}
            onPress={handleFilterToggle}
            variant="compact"
          />
        ))}
      </ScrollView>
    </View>
  );

  // Memoized market card renderer for better performance
  const renderMarketCard = useCallback(({ item }: { item: MarketCardData }) => {
    if (!item || !item.id) return null;
    return (
      <MarketCard
        market={item}
        onPress={() => handleMarketPress(item)}
        onCall={() => handleCall(item)}
        onDirections={() => handleDirections(item)}
        onFavorite={() => handleFavorite(item)}
        isFavorite={checkIsFavorite(item.id.toString())}
        showQuickActions={true}
      />
    );
  }, [handleMarketPress, handleCall, handleDirections, handleFavorite, checkIsFavorite]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🗺️ Explore Markets</Text>
        <TouchableOpacity
          onPress={() => setDataSource(dataSource === 'supabase' ? 'usda' : 'supabase')}
          style={styles.dataSourceButton}
        >
          <Text style={styles.dataSourceText}>
            {dataSource === 'supabase' ? 'DB' : 'API'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      {renderSearchBar()}
      {renderFilters()}

      {/* Map */}
      <View style={styles.mapContainer}>
        <ClusteredMapView
          style={styles.map}
          mapRef={mapRef}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
          markets={filteredMarkets.map(market => ({
            id: market.id.toString(),
            name: market.name,
            latitude: market.coordinate.latitude,
            longitude: market.coordinate.longitude,
            coordinate: market.coordinate,
            address: market.address,
            phone: market.phone || '',
            website: '',
            hours: '',
            fullHours: '',
            organicOnly: market.organic || false,
            acceptsSnap: market.acceptsSnap || false,
            petFriendly: market.petFriendly || false,
            isOpen: market.isOpen,
          }))}
          onMarkerPress={(market) => handleMarketPress({
            id: market.id,
            name: market.name,
            address: market.address,
            phone: market.phone || '',
            coordinate: market.coordinate,
            isOpen: market.isOpen ?? true,
            organic: market.organicOnly || false,
            acceptsSnap: market.acceptsSnap || false,
            petFriendly: market.petFriendly || false,
          })}
          checkIsFavorite={checkIsFavorite}
          toggleFavorite={toggleFavorite}
        />
      </View>

      {/* Expandable Bottom Sheet */}
      <ExpandableBottomSheet
        title={`${filteredMarkets.length} Markets Found`}
        subtitle={searchQuery ? `Results for "${searchQuery}"` : 'Swipe up to see all markets'}
        isExpanded={isBottomSheetExpanded}
        onToggle={setIsBottomSheetExpanded}
        minHeight={120}
        maxHeight={screenHeight * 0.6}
      >
        <FlatList
          data={filteredMarkets}
          renderItem={renderMarketCard}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={100}
          initialNumToRender={8}
          windowSize={10}
          getItemLayout={(_, index) => ({
            length: 160, // Approximate height of MarketCard
            offset: 160 * index,
            index,
          })}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="storefront-outline" size={48} color="#ccc" />
              <Text style={styles.emptyTitle}>No markets found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search or filters
              </Text>
            </View>
          }
        />
      </ExpandableBottomSheet>

      {/* Loading overlay - positioned to not block map interactions */}
      {(loading || isLoadingSupabase) && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#2E8B57" />
          <Text style={styles.loadingText}>Loading markets...</Text>
        </View>
      )}
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#2E8B57',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  dataSourceButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dataSourceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  locationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filtersContainer: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
  },
  filtersList: {
    paddingHorizontal: 20,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});

export default MapScreen;