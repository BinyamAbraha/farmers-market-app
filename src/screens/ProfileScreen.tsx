import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useFavorites } from '../hooks/useFavorites';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';

// Import or define the same markets array as in MapScreen for demo
const markets = [
  {
    id: 1,
    name: 'Downtown Farmers Market',
    coordinate: { latitude: 40.7589, longitude: -73.9851 },
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
    coordinate: { latitude: 37.7749, longitude: -122.4194 },
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
    coordinate: { latitude: 41.8781, longitude: -87.6298 },
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

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

export default function ProfileScreen() {
  const { favorites, toggleFavorite, checkIsFavorite } = useFavorites();
  const navigation = useNavigation<any>();

  const favoriteMarkets = markets.filter(m => favorites.includes(m.id.toString()));

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

  const renderAttributeBadges = (market: typeof markets[0]) => (
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Favorites</Text>
      {favoriteMarkets.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={64} color="#bbb" />
          <Text style={styles.emptyText}>You haven't added any favorites yet.</Text>
        </View>
      ) : (
        <ScrollView style={styles.favoritesList}>
          {favoriteMarkets.map(market => (
            <TouchableOpacity
              key={market.id}
              style={styles.marketCard}
              onPress={() => navigation.navigate('MarketDetail', { market })}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.marketName}>{market.name}</Text>
                <HeartIcon marketId={market.id.toString()} />
              </View>
              <Text style={styles.marketInfo}>{market.address}</Text>
              <Text style={styles.marketStatus}>
                {market.isOpen ? 'Open Now' : 'Closed'}
              </Text>
              {renderAttributeBadges(market)}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2E8B57',
  },
  favoritesList: {
    flex: 1,
  },
  marketCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
  marketStatus: {
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
    marginRight: 8,
    marginBottom: 4,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
    textAlign: 'center',
  },
});