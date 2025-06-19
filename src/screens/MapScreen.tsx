import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Pressable,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { MapScreenNavigationProp } from '../types/navigation';
import { openMapsApp } from '../utils/deviceActions';
import { useFavorites } from '../hooks/useFavorites';
import { useMarketData } from '../hooks/useMarketData';
import ClusteredMapView from '../components/ClusteredMapView';
type FilterType = 'organic' | 'acceptsSnap' | 'petFriendly';

export default function MapScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterType[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<any | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [isOpeningDirections, setIsOpeningDirections] = useState(false);
  const [debugDisableClustering, setDebugDisableClustering] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 39.8283,
    longitude: -98.5795,
    latitudeDelta: 20,
    longitudeDelta: 20,
  });
  const [lastLoadedRegion, setLastLoadedRegion] = useState<typeof mapRegion | null>(null);
  const regionChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const mapRef = useRef<MapView>(null);
  const navigation = useNavigation<MapScreenNavigationProp>();
  const { favorites, toggleFavorite, checkIsFavorite } = useFavorites();
  
  // USDA API Integration
  const { 
    markets, 
    loading, 
    error, 
    loadMarketsByState, 
    loadMarketsByLocation, 
    loadMarketsByZip,
    loadMarketsByRegion
  } = useMarketData();

  // Filter markets based on search query and active filters
  const filteredMarkets = useMemo(() => {
    let filtered = markets;
    
    // Favorites filter
    if (favoritesOnly) {
      filtered = filtered.filter(market => checkIsFavorite(market.id));
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(market => 
        market.name.toLowerCase().includes(query) ||
        market.address.toLowerCase().includes(query)
      );
    }
    
    // Feature filters
    if (activeFilters.length > 0) {
      filtered = filtered.filter(market => 
        activeFilters.every(filter => {
          switch (filter) {
            case 'organic':
              return market.organicOnly;
            case 'acceptsSnap':
              return market.acceptsSnap || market.acceptsWic;
            case 'petFriendly':
              return market.petFriendly;
            default:
              return true;
          }
        })
      );
    }
    
    return filtered;
  }, [markets, searchQuery, activeFilters, favoritesOnly, favorites]);

  // Check if region has changed significantly enough to warrant new data loading
  const hasRegionChangedSignificantly = useCallback((newRegion: typeof mapRegion, oldRegion: typeof mapRegion | null) => {
    if (!oldRegion) return true;
    
    const latDiff = Math.abs(newRegion.latitude - oldRegion.latitude);
    const lonDiff = Math.abs(newRegion.longitude - oldRegion.longitude);
    const latDeltaDiff = Math.abs(newRegion.latitudeDelta - oldRegion.latitudeDelta);
    const lonDeltaDiff = Math.abs(newRegion.longitudeDelta - oldRegion.longitudeDelta);
    
    // Trigger reload if center moved by more than 50% of the current view (increased threshold)
    // or if zoom level changed significantly (also increased threshold)
    return (
      latDiff > newRegion.latitudeDelta * 0.5 ||
      lonDiff > newRegion.longitudeDelta * 0.5 ||
      latDeltaDiff > oldRegion.latitudeDelta * 0.75 ||
      lonDeltaDiff > oldRegion.longitudeDelta * 0.75
    );
  }, []);

  // Debounced function to load markets for a region
  const loadMarketsForRegionDebounced = useCallback(async (region: typeof mapRegion) => {
    // Only load new data if the region changed significantly
    if (hasRegionChangedSignificantly(region, lastLoadedRegion)) {
      console.log('📍 Region changed significantly, loading new market data');
      
      try {
        await loadMarketsByRegion(
          region.latitude,
          region.longitude,
          region.latitudeDelta,
          region.longitudeDelta
        );
        setLastLoadedRegion(region);
      } catch (error) {
        console.error('❌ Error loading markets for new region:', error);
      }
    }
  }, [hasRegionChangedSignificantly, lastLoadedRegion, loadMarketsByRegion]);

  // Handle map region changes with debouncing
  const handleRegionChangeComplete = useCallback((region: typeof mapRegion) => {
    console.log('🗺️ Map region changed:', region);
    
    // Update region immediately for UI responsiveness
    setMapRegion(region);
    
    // Clear previous timeout
    if (regionChangeTimeoutRef.current) {
      clearTimeout(regionChangeTimeoutRef.current);
    }
    
    // Debounce API calls by 1 second
    regionChangeTimeoutRef.current = setTimeout(() => {
      loadMarketsForRegionDebounced(region);
    }, 1000);
  }, [loadMarketsForRegionDebounced]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (regionChangeTimeoutRef.current) {
        clearTimeout(regionChangeTimeoutRef.current);
      }
    };
  }, []);

  // Load initial data on component mount
  useEffect(() => {
    // Start with California markets
    loadMarketsByState('CA');
  }, [loadMarketsByState]);

  const handleMarkerPress = (market: any) => {
    setSelectedMarket(market);
  };

  const handleClusterPress = (cluster: any) => {
    const [longitude, latitude] = cluster.geometry.coordinates;
    const clusterZoom = Math.min(16, mapRegion.longitudeDelta > 0.1 ? mapRegion.longitudeDelta / 2 : 0.05);
    
    const newRegion = {
      latitude,
      longitude,
      latitudeDelta: clusterZoom,
      longitudeDelta: clusterZoom,
    };
    
    setMapRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 500);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const toggleFilter = (filter: FilterType) => {
    setActiveFilters(prev => 
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const getFilterButtonStyle = (filter: FilterType | 'favorites') => {
    return [
      styles.filterButton,
      (activeFilters.includes(filter as FilterType) || (filter === 'favorites' && favoritesOnly)) && styles.filterButtonActive
    ];
  };

  const getFilterButtonTextStyle = (filter: FilterType | 'favorites') => {
    return [
      styles.filterButtonText,
      (activeFilters.includes(filter as FilterType) || (filter === 'favorites' && favoritesOnly)) && styles.filterButtonTextActive
    ];
  };

  const renderAttributeBadges = (market: any) => {
    return (
      <View style={styles.badgeContainer}>
        {market.organicOnly && (
          <View style={[styles.badge, styles.organicBadge]}>
            <Text style={styles.badgeText}>Organic</Text>
          </View>
        )}
        {(market.acceptsSnap || market.acceptsWic) && (
          <View style={[styles.badge, styles.snapBadge]}>
            <Text style={styles.badgeText}>SNAP/WIC</Text>
          </View>
        )}
        {market.petFriendly && (
          <View style={[styles.badge, styles.petBadge]}>
            <Text style={styles.badgeText}>Pet Friendly</Text>
          </View>
        )}
      </View>
    );
  };

  const handleGetDirections = async () => {
    if (!selectedMarket) return;
    setIsOpeningDirections(true);
    try {
      await openMapsApp(
        selectedMarket.latitude,
        selectedMarket.longitude,
        selectedMarket.name
      );
    } finally {
      setIsOpeningDirections(false);
    }
  };

  const handleViewDetails = () => {
    if (selectedMarket) {
      navigation.navigate('MarketDetail', { market: selectedMarket });
      setSelectedMarket(null);
    }
  };

  const handleFindNearMe = async () => {
    try {
      setIsLoadingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to find markets near you.',
          [{ text: 'OK' }]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation(location);

      // Load markets near current location using USDA API
      await loadMarketsByLocation(
        location.coords.latitude, 
        location.coords.longitude, 
        50 // 50 mile radius
      );

      // Update map region
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 1.0,
        longitudeDelta: 1.0,
      };
      setMapRegion(newRegion);

      // Animate map to user location
      mapRef.current?.animateToRegion(newRegion, 1000);

    } catch (error) {
      Alert.alert(
        'Error',
        'Unable to get your location. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Quick state search function
  const handleStateSearch = async (state: string) => {
    console.log(`🗺️ User selected state: ${state}`);
    await loadMarketsByState(state);
    
    // Update map region to state center
    const stateRegions: { [key: string]: { latitude: number, longitude: number } } = {
      'CA': { latitude: 36.7783, longitude: -119.4179 },
      'NY': { latitude: 42.1657, longitude: -74.9481 },
      'TX': { latitude: 31.9686, longitude: -99.9018 },
      'FL': { latitude: 27.7663, longitude: -82.8001 },
      'IL': { latitude: 40.3363, longitude: -89.0022 },
      'PA': { latitude: 41.2033, longitude: -77.1945 },
      'OH': { latitude: 40.3888, longitude: -82.7649 },
      'GA': { latitude: 33.7490, longitude: -84.3880 },
      'NC': { latitude: 35.5951, longitude: -79.0193 },
      'WA': { latitude: 47.0379, longitude: -120.5542 },
    };
    
    const region = stateRegions[state.toUpperCase()];
    if (region) {
      const newRegion = {
        ...region,
        latitudeDelta: 6,
        longitudeDelta: 6,
      };
      setMapRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
    }
  };


  // Market Card Heart Icon
  const HeartIcon = ({ marketId }: { marketId: string }) => {
    const isFav = checkIsFavorite(marketId);
    const scale = new Animated.Value(1);
    const handlePress = () => {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.3, duration: 120, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true })
      ]).start();
      toggleFavorite(marketId);
    };
    return (
      <TouchableOpacity onPress={handlePress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={24}
            color={isFav ? '#E74C3C' : '#bbb'}
          />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search farmers markets..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={handleClearSearch}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Quick State Buttons */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stateContainer}>
        {['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'WA'].map(state => (
          <TouchableOpacity
            key={state}
            style={styles.stateButton}
            onPress={() => handleStateSearch(state)}
            disabled={loading}
          >
            <Text style={[styles.stateButtonText, loading && styles.stateButtonDisabled]}>
              {state}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Filter Buttons */}
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>
          Filters: {activeFilters.length > 0 && `(${activeFilters.length} active)`}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          <TouchableOpacity 
            style={getFilterButtonStyle('organic')}
            onPress={() => toggleFilter('organic')}
          >
            <Text style={getFilterButtonTextStyle('organic')}>Organic</Text>
          </TouchableOpacity>
        <TouchableOpacity 
          style={getFilterButtonStyle('acceptsSnap')}
          onPress={() => toggleFilter('acceptsSnap')}
        >
          <Text style={getFilterButtonTextStyle('acceptsSnap')}>SNAP/WIC</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={getFilterButtonStyle('petFriendly')}
          onPress={() => toggleFilter('petFriendly')}
        >
          <Text style={getFilterButtonTextStyle('petFriendly')}>Pet Friendly</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={getFilterButtonStyle('favorites')}
          onPress={() => setFavoritesOnly(fav => !fav)}
        >
          <Text style={getFilterButtonTextStyle('favorites')}>Favorites Only</Text>
        </TouchableOpacity>
        
        {/* Clear Filters Button - only show when filters are active */}
        {(activeFilters.length > 0 || favoritesOnly) && (
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={() => {
              setActiveFilters([]);
              setFavoritesOnly(false);
            }}
          >
            <Text style={styles.clearFiltersText}>Clear All</Text>
          </TouchableOpacity>
        )}
        </ScrollView>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E8B57" />
          <Text style={styles.loadingText}>Loading farmers markets...</Text>
        </View>
      )}

      {/* Error Message with API Status */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error.includes('mock') || error.includes('fallback') ? 
              'ℹ️ Using demo data - USDA API temporarily unavailable' : 
              `Error: ${error}`
            }
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => loadMarketsByState('CA')}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* API Status Info */}
      {markets.length > 0 && !loading && !error && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            📍 Showing {markets.length} farmers markets
          </Text>
        </View>
      )}

      {/* Map with Clustering */}
      <View style={styles.mapContainer}>
        <ClusteredMapView
          mapRef={mapRef}
          style={styles.map}
          region={mapRegion}
          markets={filteredMarkets}
          onMarkerPress={handleMarkerPress}
          onRegionChangeComplete={handleRegionChangeComplete}
          showsUserLocation={true}
          checkIsFavorite={checkIsFavorite}
          toggleFavorite={toggleFavorite}
          onClusterPress={handleClusterPress}
          disableClustering={debugDisableClustering}
        />

        {/* Find Near Me Button */}
        <TouchableOpacity 
          style={styles.fab}
          onPress={handleFindNearMe}
          disabled={isLoadingLocation}
        >
          {isLoadingLocation ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons name="location" size={24} color="#fff" />
          )}
        </TouchableOpacity>

        {/* Markets Count Badge */}
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>
            {filteredMarkets.length} markets
          </Text>
        </View>

        {/* Debug Toggle Button */}
        <TouchableOpacity 
          style={[styles.fab, { bottom: 80, backgroundColor: debugDisableClustering ? '#E74C3C' : '#9B59B6' }]}
          onPress={() => setDebugDisableClustering(!debugDisableClustering)}
        >
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
            {debugDisableClustering ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Nearby Markets Section */}
      <View style={styles.nearbyContainer}>
        <Text style={styles.nearbyTitle}>
          {filteredMarkets.length} {filteredMarkets.length === 1 ? 'Market' : 'Markets'} Found
        </Text>
        
        {/* Market Cards */}
        <ScrollView style={styles.marketCardsContainer}>
          {filteredMarkets.slice(0, 5).map((market) => (
            <TouchableOpacity
              key={market.id}
              style={styles.marketCard}
              onPress={() => navigation.navigate('MarketDetail', { market })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.marketName}>{market.name}</Text>
                <HeartIcon marketId={market.id} />
              </View>
              <Text style={styles.marketInfo}>{market.address}</Text>
              <Text style={styles.marketStatus}>
                {market.isOpen ? '🟢 Open Now' : '🔴 Closed'}
              </Text>
              {renderAttributeBadges(market)}
            </TouchableOpacity>
          ))}
          
          {filteredMarkets.length > 5 && (
            <TouchableOpacity style={styles.viewMoreButton}>
              <Text style={styles.viewMoreText}>
                View {filteredMarkets.length - 5} more markets...
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Market Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={selectedMarket !== null}
        onRequestClose={() => setSelectedMarket(null)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setSelectedMarket(null)}
        >
          <Pressable style={styles.modalContent}>
            {selectedMarket && (
              <>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setSelectedMarket(null)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.modalTitle}>{selectedMarket.name}</Text>
                  <HeartIcon marketId={selectedMarket.id} />
                </View>
                
                <View style={styles.modalStatusContainer}>
                  <View style={[
                    styles.statusIndicator,
                    { backgroundColor: selectedMarket.isOpen ? '#4CAF50' : '#F44336' }
                  ]} />
                  <Text style={styles.modalStatusText}>
                    {selectedMarket.isOpen ? 'Open' : 'Closed'}
                  </Text>
                </View>

                <Text style={styles.modalAddress}>{selectedMarket.address}</Text>
                
                {selectedMarket.phone && (
                  <Text style={styles.modalPhone}>📞 {selectedMarket.phone}</Text>
                )}
                
                {selectedMarket.website && (
                  <Text style={styles.modalWebsite}>🌐 {selectedMarket.website}</Text>
                )}

                {renderAttributeBadges(selectedMarket)}

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.directionsButton]}
                    onPress={handleGetDirections}
                    disabled={isOpeningDirections}
                  >
                    {isOpeningDirections ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.modalButtonText}>Get Directions</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.detailsButton]}
                    onPress={handleViewDetails}
                  >
                    <Text style={styles.modalButtonText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  clearButton: {
    padding: 12,
  },
  clearButtonText: {
    color: '#666',
    fontSize: 16,
  },
  stateContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  stateButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    marginRight: 8,
    minWidth: 35,
    alignItems: 'center',
  },
  stateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  stateButtonDisabled: {
    color: '#999',
  },
  filterSection: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterButton: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#d0e8d0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  filterButtonActive: {
    backgroundColor: '#2E8B57',
    borderColor: '#2E8B57',
    shadowOpacity: 0.2,
    elevation: 2,
  },
  filterButtonText: {
    color: '#2E8B57',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  clearFiltersButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#d32f2f',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  clearFiltersText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    margin: 16,
    borderRadius: 8,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    padding: 15,
    backgroundColor: '#ffe6e6',
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusContainer: {
    padding: 8,
    backgroundColor: '#e8f5e8',
    marginHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#2E8B57',
    fontWeight: '500',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#2E8B57',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  mapContainer: {
    height: 300,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2E8B57',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  countBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  nearbyContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  nearbyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  marketCardsContainer: {
    maxHeight: 300,
  },
  marketCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  marketName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    flex: 1,
  },
  marketInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  marketStatus: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  viewMoreButton: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginTop: 8,
  },
  viewMoreText: {
    color: '#2E8B57',
    fontSize: 16,
    fontWeight: '500',
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  organicBadge: {
    backgroundColor: '#2E8B57',
  },
  snapBadge: {
    backgroundColor: '#4A90E2',
  },
  petBadge: {
    backgroundColor: '#E2844A',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    paddingRight: 24,
    flex: 1,
  },
  modalStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  modalStatusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  modalAddress: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  modalPhone: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  modalWebsite: {
    fontSize: 16,
    color: '#4A90E2',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  directionsButton: {
    backgroundColor: '#2E8B57',
  },
  detailsButton: {
    backgroundColor: '#4A90E2',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});