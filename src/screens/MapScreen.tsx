import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

export default function MapScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search farmers markets..."
          placeholderTextColor="#666"
        />
      </View>

      {/* Filter Buttons */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterButtonText}>Organic</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterButtonText}>SNAP/WIC</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterButtonText}>Pet Friendly</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapTitle}>🗺️ Farmers Markets Map</Text>
        <Text style={styles.mapSubtitle}>Map functionality coming soon!</Text>
      </View>

      {/* Nearby Markets Section */}
      <View style={styles.nearbyContainer}>
        <Text style={styles.nearbyTitle}>3 Markets Nearby</Text>
        
        {/* Market Cards */}
        <ScrollView style={styles.marketCardsContainer}>
          <View style={styles.marketCard}>
            <Text style={styles.marketName}>Union Square Greenmarket</Text>
            <Text style={styles.marketInfo}>Open Today • 8:00 AM - 6:00 PM</Text>
            <Text style={styles.marketDistance}>0.5 miles away</Text>
          </View>

          <View style={styles.marketCard}>
            <Text style={styles.marketName}>Downtown Farmers Market</Text>
            <Text style={styles.marketInfo}>Open Today • 9:00 AM - 5:00 PM</Text>
            <Text style={styles.marketDistance}>1.2 miles away</Text>
          </View>

          <View style={styles.marketCard}>
            <Text style={styles.marketName}>Riverside Market</Text>
            <Text style={styles.marketInfo}>Open Today • 7:00 AM - 4:00 PM</Text>
            <Text style={styles.marketDistance}>2.0 miles away</Text>
          </View>
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
  searchInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
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
  filterButtonText: {
    color: '#2E8B57',
    fontWeight: '600',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 16,
    borderRadius: 12,
  },
  mapTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E8B57',
    marginBottom: 8,
  },
  mapSubtitle: {
    fontSize: 16,
    color: '#666',
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
  },
});