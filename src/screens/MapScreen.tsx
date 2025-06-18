import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

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
    petFriendly: false
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
    petFriendly: true
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
    petFriendly: true
  }
];

type FilterType = 'organic' | 'acceptsSnap' | 'petFriendly';

export default function MapScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterType[]>([]);

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

  const handleMarkerPress = (marketName: string) => {
    console.log('Selected market:', marketName);
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
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: 39.8283,
            longitude: -98.5795,
            latitudeDelta: 20,
            longitudeDelta: 20,
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
        >
          {filteredMarkets.map((market) => (
            <Marker
              key={market.id}
              coordinate={market.coordinate}
              title={market.name}
              description={`Open Today • ${market.hours}`}
              pinColor="#2E8B57"
              onPress={() => handleMarkerPress(market.name)}
            />
          ))}
        </MapView>
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
});