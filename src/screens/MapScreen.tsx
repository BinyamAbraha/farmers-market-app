import React, { useState, useMemo, useRef } from 'react';
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
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { MapScreenNavigationProp } from '../types/navigation';

// Market data for markers
const markets = [
  {
    id: 1,
    name: 'Downtown Farmers Market',
    coordinate: {
      latitude: 40.7589,
      longitude: -73.9851
    },
    hours: '9:00 AM - 5:00 PM',
    distance: '1.2 miles away',
    organic: true,
    acceptsSnap: true,
    petFriendly: false,
    address: '123 Broadway, New York, NY 10001',
    fullHours: 'Monday-Saturday: 9:00 AM - 5:00 PM\nSunday: 10:00 AM - 4:00 PM',
    isOpen: true
  },
  {
    id: 2,
    name: 'Riverside Market',
    coordinate: {
      latitude: 37.7749,
      longitude: -122.4194
    },
    hours: '7:00 AM - 4:00 PM',
    distance: '2.0 miles away',
    organic: false,
    acceptsSnap: true,
    petFriendly: true,
    address: '456 Market Street, San Francisco, CA 94105',
    fullHours: 'Monday-Friday: 7:00 AM - 4:00 PM\nSaturday: 8:00 AM - 5:00 PM\nSunday: Closed',
    isOpen: true
  },
  {
    id: 3,
    name: 'Community Garden Market',
    coordinate: {
      latitude: 41.8781,
      longitude: -87.6298
    },
    hours: '8:00 AM - 6:00 PM',
    distance: '0.5 miles away',
    organic: true,
    acceptsSnap: false,
    petFriendly: true,
    address: '789 Michigan Avenue, Chicago, IL 60601',
    fullHours: 'Monday-Sunday: 8:00 AM - 6:00 PM',
    isOpen: false
  }
];

type FilterType = 'organic' | 'acceptsSnap' | 'petFriendly';

export default function MapScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterType[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<typeof markets[0] | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const mapRef = useRef<MapView>(null);
  const navigation = useNavigation<MapScreenNavigationProp>();

  // Filter markets based on search query and active filters
  const filteredMarkets = useMemo(() => {
    let filtered = markets;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(market => 
        market.name.toLowerCase().includes(query)
      );
    }
    
    // Apply attribute filters
    if (activeFilters.length > 0) {
      filtered = filtered.filter(market => 
        activeFilters.every(filter => {
          switch (filter) {
            case 'organic':
              return market.organic;
            case 'acceptsSnap':
              return market.acceptsSnap;
            case 'petFriendly':
              return market.petFriendly;
            default:
              return true;
          }
        })
      );
    }
    
    return filtered;
  }, [searchQuery, activeFilters]);

  const handleMarkerPress = (market: typeof markets[0]) => {
    setSelectedMarket(market);
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

  const getFilterButtonStyle = (filter: FilterType) => {
    return [
      styles.filterButton,
      activeFilters.includes(filter) && styles.filterButtonActive
    ];
  };

  const getFilterButtonTextStyle = (filter: FilterType) => {
    return [
      styles.filterButtonText,
      activeFilters.includes(filter) && styles.filterButtonTextActive
    ];
  };

  const renderAttributeBadges = (market: typeof markets[0]) => {
    return (
      <View style={styles.badgeContainer}>
        {market.organic && (
          <View style={[styles.badge, styles.organicBadge]}>
            <Text style={styles.badgeText}>Organic</Text>
          </View>
        )}
        {market.acceptsSnap && (
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

  const handleGetDirections = () => {
    console.log('Get directions to:', selectedMarket?.name);
  };

  const handleViewDetails = () => {
    if (selectedMarket) {
      navigation.navigate('MarketDetail', { market: selectedMarket });
      setSelectedMarket(null); // Close the modal
    }
  };

  const handleFindNearMe = async () => {
    try {
      setIsLoadingLocation(true);

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to find markets near you.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation(location);

      // Animate map to user location
      mapRef.current?.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);

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

      {/* Filter Buttons */}
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
      </ScrollView>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: 39.8283,
            longitude: -98.5795,
            latitudeDelta: 20,
            longitudeDelta: 20,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
        >
          {filteredMarkets.map((market) => (
            <Marker
              key={market.id}
              coordinate={market.coordinate}
              title={market.name}
              description={`Open Today • ${market.hours}`}
              pinColor="#2E8B57"
              onPress={() => handleMarkerPress(market)}
            />
          ))}
        </MapView>

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
      </View>

      {/* Nearby Markets Section */}
      <View style={styles.nearbyContainer}>
        <Text style={styles.nearbyTitle}>
          {filteredMarkets.length} {filteredMarkets.length === 1 ? 'Market' : 'Markets'} Nearby
        </Text>
        
        {/* Market Cards */}
        <ScrollView style={styles.marketCardsContainer}>
          {filteredMarkets.map((market) => (
            <View key={market.id} style={styles.marketCard}>
              <Text style={styles.marketName}>{market.name}</Text>
              <Text style={styles.marketInfo}>Open Today • {market.hours}</Text>
              <Text style={styles.marketDistance}>{market.distance}</Text>
              {renderAttributeBadges(market)}
            </View>
          ))}
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

                <Text style={styles.modalTitle}>{selectedMarket.name}</Text>
                
                <View style={styles.statusContainer}>
                  <View style={[
                    styles.statusIndicator,
                    { backgroundColor: selectedMarket.isOpen ? '#4CAF50' : '#F44336' }
                  ]} />
                  <Text style={styles.statusText}>
                    {selectedMarket.isOpen ? 'Open' : 'Closed'}
                  </Text>
                </View>

                <Text style={styles.modalAddress}>{selectedMarket.address}</Text>
                <Text style={styles.modalHours}>{selectedMarket.fullHours}</Text>

                {renderAttributeBadges(selectedMarket)}

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.directionsButton]}
                    onPress={handleGetDirections}
                  >
                    <Text style={styles.modalButtonText}>Get Directions</Text>
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
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButton: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#2E8B57',
  },
  filterButtonText: {
    color: '#2E8B57',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
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
  },
  marketInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  marketDistance: {
    fontSize: 14,
    color: '#2E8B57',
    fontWeight: '500',
    marginBottom: 8,
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
  },
  statusContainer: {
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
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  modalAddress: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  modalHours: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 24,
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