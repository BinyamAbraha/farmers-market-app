import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Share,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { MarketDetailScreenNavigationProp } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { openMapsApp, makePhoneCall, openWebsite, shareMarket } from '../utils/deviceActions';
import { useFavorites } from '../hooks/useFavorites';

// Sample data for vendors
const vendors = [
  {
    id: 1,
    name: 'Green Valley Farms',
    specialty: 'Organic Produce',
    description: 'Fresh, locally grown organic vegetables and fruits. Specializing in heirloom tomatoes and seasonal greens.',
  },
  {
    id: 2,
    name: 'Artisan Bread Co.',
    specialty: 'Bakery',
    description: 'Handcrafted sourdough, rye, and specialty breads made fresh daily using traditional methods.',
  },
  {
    id: 3,
    name: 'Blooming Fields',
    specialty: 'Flowers & Plants',
    description: 'Seasonal cut flowers, potted plants, and custom bouquets. All locally grown and sustainably harvested.',
  },
  {
    id: 4,
    name: 'Sweet Harvest',
    specialty: 'Honey & Jams',
    description: 'Raw honey, artisanal jams, and preserves made from locally sourced fruits and berries.',
  },
];

// Sample data for reviews
const reviews = [
  {
    id: 1,
    name: 'Sarah Johnson',
    rating: 5,
    comment: 'Amazing selection of fresh produce! The vendors are friendly and knowledgeable. Love the weekly flower arrangements.',
    date: '2 weeks ago',
  },
  {
    id: 2,
    name: 'Michael Chen',
    rating: 4,
    comment: 'Great market with a good variety of vendors. The bread from Artisan Bread Co. is exceptional. Parking can be a bit challenging.',
    date: '1 month ago',
  },
  {
    id: 3,
    name: 'Emma Rodriguez',
    rating: 5,
    comment: 'My favorite Saturday morning spot! The organic produce is always fresh and the prices are reasonable. Highly recommend!',
    date: '2 months ago',
  },
];

type MarketDetailScreenProps = {
  navigation: MarketDetailScreenNavigationProp;
  route: {
    params: {
      market: {
        id: number;
        name: string;
        address: string;
        hours: string;
        fullHours: string;
        phone: string;
        website: string;
        organic: boolean;
        acceptsSnap: boolean;
        petFriendly: boolean;
        isOpen: boolean;
        coordinate: {
          latitude: number;
          longitude: number;
        };
      };
    };
  };
};

export default function MarketDetailScreen({ navigation, route }: MarketDetailScreenProps) {
  const { market } = route.params;

  const [isOpeningDirections, setIsOpeningDirections] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [isOpeningWebsite, setIsOpeningWebsite] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const { checkIsFavorite, toggleFavorite } = useFavorites();

  const handleGetDirections = async () => {
    setIsOpeningDirections(true);
    try {
      await openMapsApp(
        market.coordinate.latitude,
        market.coordinate.longitude,
        market.name
      );
    } finally {
      setIsOpeningDirections(false);
    }
  };

  const handleCallPhone = async () => {
    setIsCalling(true);
    try {
      await makePhoneCall(market.phone);
    } finally {
      setIsCalling(false);
    }
  };

  const handleVisitWebsite = async () => {
    setIsOpeningWebsite(true);
    try {
      await openWebsite(market.website);
    } finally {
      setIsOpeningWebsite(false);
    }
  };

  const handleShareMarket = async () => {
    setIsSharing(true);
    try {
      await shareMarket(market.name, market.address, market.fullHours);
    } finally {
      setIsSharing(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={16}
            color="#FFD700"
          />
        ))}
      </View>
    );
  };

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
            size={28}
            color={isFav ? '#E74C3C' : '#bbb'}
          />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Hero Section */}
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80' }}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.marketName}>{market.name}</Text>
            <HeartIcon marketId={market.id.toString()} />
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: market.isOpen ? '#4CAF50' : '#F44336' }
          ]}>
            <Text style={styles.statusText}>
              {market.isOpen ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Info Card */}
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Ionicons name="location" size={24} color="#2E8B57" />
          <Text style={styles.infoText}>{market.address}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time" size={24} color="#2E8B57" />
          <Text style={styles.infoText}>{market.fullHours}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call" size={24} color="#2E8B57" />
          <Text style={styles.infoText}>{market.phone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="globe" size={24} color="#2E8B57" />
          <Text style={styles.infoText}>{market.website}</Text>
        </View>
      </View>

      {/* Filter Badges */}
      <View style={styles.badgesContainer}>
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

      {/* Vendors Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured Vendors</Text>
        {vendors.map((vendor) => (
          <View key={vendor.id} style={styles.vendorCard}>
            <Text style={styles.vendorName}>{vendor.name}</Text>
            <Text style={styles.vendorSpecialty}>{vendor.specialty}</Text>
            <Text style={styles.vendorDescription}>{vendor.description}</Text>
          </View>
        ))}
      </View>

      {/* Reviews Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Reviews</Text>
        {reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewerName}>{review.name}</Text>
              <Text style={styles.reviewDate}>{review.date}</Text>
            </View>
            {renderStars(review.rating)}
            <Text style={styles.reviewComment}>{review.comment}</Text>
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.directionsButton]}
          onPress={handleGetDirections}
          disabled={isOpeningDirections}
        >
          {isOpeningDirections ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="navigate" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Get Directions</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.phoneButton]}
          onPress={handleCallPhone}
          disabled={isCalling}
        >
          {isCalling ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="call" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Call</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.websiteButton]}
          onPress={handleVisitWebsite}
          disabled={isOpeningWebsite}
        >
          {isOpeningWebsite ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="globe" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Website</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.shareButton]}
          onPress={handleShareMarket}
          disabled={isSharing}
        >
          {isSharing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="share" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Share</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  heroContainer: {
    height: 250,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  marketName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
  },
  card: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '600',
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  vendorCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  vendorSpecialty: {
    fontSize: 16,
    color: '#2E8B57',
    marginBottom: 8,
  },
  vendorDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  reviewCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  reviewDate: {
    fontSize: 14,
    color: '#666',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reviewComment: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  directionsButton: {
    backgroundColor: '#2E8B57',
  },
  phoneButton: {
    backgroundColor: '#4A90E2',
  },
  websiteButton: {
    backgroundColor: '#E2844A',
  },
  shareButton: {
    backgroundColor: '#666',
  },
}); 