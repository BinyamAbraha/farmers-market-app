import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { MarketDetailScreenNavigationProp } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { openMapsApp, makePhoneCall, openWebsite, shareMarket } from '../utils/deviceActions';
import { useFavorites } from '../hooks/useFavorites';
import PhotoCapture from '../components/PhotoCapture';
import PhotoUpload from '../components/PhotoUpload';
import PhotoGallery from '../components/PhotoGallery';
import { MarketPhoto, photoService } from '../services/supabase';

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

interface MarketDetailProps {
  navigation: any;
  route: any;
}

export default function MarketDetailScreen({ navigation, route }: MarketDetailProps) {
  // Safe parameter extraction with fallbacks
  const market = route?.params?.market;
  
  // Comprehensive safety check for market object
  if (!market || !market.id || !market.name) {
    console.error('MarketDetailScreen: Invalid market data:', { market, route: route?.params });
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 18, color: '#666' }}>Market information not available</Text>
        <Text style={{ fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center' }}>
          Unable to load market details. Please try again.
        </Text>
        <TouchableOpacity 
          style={{ marginTop: 20, padding: 12, backgroundColor: '#2E8B57', borderRadius: 8 }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const [isOpeningDirections, setIsOpeningDirections] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [isOpeningWebsite, setIsOpeningWebsite] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  // Photo sharing states
  const [marketPhotos, setMarketPhotos] = useState<MarketPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [captureVisible, setCaptureVisible] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string>('');

  const { checkIsFavorite, toggleFavorite } = useFavorites();

  // Load market photos on component mount
  useEffect(() => {
    if (market?.id) {
      loadMarketPhotos();
    }
  }, [market?.id]);

  const loadMarketPhotos = async () => {
    if (!market?.id) {
      console.warn('Cannot load photos: No market ID available');
      return;
    }
    
    try {
      setPhotosLoading(true);
      const photos = await photoService.getMarketPhotos(market.id.toString());
      setMarketPhotos(photos);
    } catch (error) {
      console.error('Error loading market photos:', error);
      // Don't show error to user for photos, just log it
    } finally {
      setPhotosLoading(false);
    }
  };

  const handlePhotoSelected = (uri: string) => {
    setSelectedPhotoUri(uri);
    setUploadVisible(true);
  };

  const handleUploadComplete = (photo: MarketPhoto) => {
    setMarketPhotos(prev => [photo, ...prev]);
    Alert.alert('Success', 'Photo shared successfully!');
  };

  const handleGetDirections = async () => {
    setIsOpeningDirections(true);
    try {
      const latitude = market.coordinate?.latitude || market.latitude || 0;
      const longitude = market.coordinate?.longitude || market.longitude || 0;
      
      if (latitude === 0 && longitude === 0) {
        Alert.alert('Error', 'Location coordinates not available for this market.');
        return;
      }
      
      await openMapsApp(latitude, longitude, market.name || 'Market');
    } catch (error) {
      console.error('Error opening directions:', error);
      Alert.alert('Error', 'Unable to open directions. Please try again.');
    } finally {
      setIsOpeningDirections(false);
    }
  };

  const handleCallPhone = async () => {
    setIsCalling(true);
    try {
      if (market.phone && typeof market.phone === 'string' && market.phone.trim()) {
        await makePhoneCall(market.phone);
      } else {
        Alert.alert('Information', 'Phone number not available for this market.');
      }
    } catch (error) {
      console.error('Error making phone call:', error);
      Alert.alert('Error', 'Unable to make phone call. Please try again.');
    } finally {
      setIsCalling(false);
    }
  };

  const handleVisitWebsite = async () => {
    setIsOpeningWebsite(true);
    try {
      if (market.website && typeof market.website === 'string' && market.website.trim()) {
        await openWebsite(market.website);
      } else {
        Alert.alert('Information', 'Website not available for this market.');
      }
    } catch (error) {
      console.error('Error opening website:', error);
      Alert.alert('Error', 'Unable to open website. Please try again.');
    } finally {
      setIsOpeningWebsite(false);
    }
  };

  const handleShareMarket = async () => {
    setIsSharing(true);
    try {
      const hoursText = typeof market.hours === 'string' 
        ? market.hours 
        : typeof market.hours === 'object' && market.hours !== null
        ? JSON.stringify(market.hours) 
        : 'Hours not available';
      await shareMarket(
        market.name || 'Unknown Market', 
        market.address || 'Address not available', 
        hoursText
      );
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
            <Text style={styles.marketName}>{market.name || 'Unknown Market'}</Text>
            <HeartIcon marketId={market.id?.toString() || '0'} />
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: market.isOpen === true ? '#4CAF50' : '#F44336' }
          ]}>
            <Text style={styles.statusText}>
              {market.isOpen === true ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Info Card */}
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Ionicons name="location" size={24} color="#2E8B57" />
          <Text style={styles.infoText}>{market.address || 'Address not available'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time" size={24} color="#2E8B57" />
          <Text style={styles.infoText}>
            {typeof market.hours === 'string' 
              ? market.hours 
              : typeof market.hours === 'object' && market.hours !== null
              ? JSON.stringify(market.hours) 
              : 'Hours not available'
            }
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call" size={24} color="#2E8B57" />
          <Text style={styles.infoText}>{market.phone || 'Phone not available'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="globe" size={24} color="#2E8B57" />
          <Text style={styles.infoText}>{market.website || 'Website not available'}</Text>
        </View>
      </View>

      {/* Filter Badges */}
      <View style={styles.badgesContainer}>
        {market.organicOnly === true && (
          <View style={[styles.badge, styles.organicBadge]}>
            <Text style={styles.badgeText}>Organic</Text>
          </View>
        )}
        {(market.acceptsSnap === true || market.acceptsWic === true) && (
          <View style={[styles.badge, styles.snapBadge]}>
            <Text style={styles.badgeText}>SNAP/WIC</Text>
          </View>
        )}
        {market.petFriendly === true && (
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

      {/* Photo Gallery Section */}
      <View style={styles.section}>
        <View style={styles.photoSectionHeader}>
          <Text style={styles.sectionTitle}>Market Photos</Text>
          <TouchableOpacity 
            onPress={() => setCaptureVisible(true)}
            style={styles.addPhotoButton}
          >
            <Ionicons name="camera" size={20} color="#2E8B57" />
            <Text style={styles.addPhotoButtonText}>Add Photo</Text>
          </TouchableOpacity>
        </View>
        
        {photosLoading ? (
          <View style={styles.photosLoadingContainer}>
            <ActivityIndicator size="small" color="#2E8B57" />
            <Text style={styles.photosLoadingText}>Loading photos...</Text>
          </View>
        ) : (
          <PhotoGallery
            photos={marketPhotos}
            onRefresh={loadMarketPhotos}
            refreshing={photosLoading}
            marketName={market.name}
          />
        )}
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
          style={[styles.actionButton, styles.phoneButton, 
            (!market.phone || !market.phone.trim()) && { opacity: 0.5 }
          ]}
          onPress={handleCallPhone}
          disabled={isCalling || !market.phone || !market.phone.trim()}
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
          style={[styles.actionButton, styles.websiteButton,
            (!market.website || !market.website.trim()) && { opacity: 0.5 }
          ]}
          onPress={handleVisitWebsite}
          disabled={isOpeningWebsite || !market.website || !market.website.trim()}
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

      {/* Photo Capture Modal */}
      <PhotoCapture
        visible={captureVisible}
        onClose={() => setCaptureVisible(false)}
        onPhotoSelected={handlePhotoSelected}
        marketId={market.id.toString()}
      />

      {/* Photo Upload Modal */}
      <PhotoUpload
        visible={uploadVisible}
        onClose={() => setUploadVisible(false)}
        onUploadComplete={handleUploadComplete}
        photoUri={selectedPhotoUri}
        marketId={market.id.toString()}
      />
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
  photoSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e8f5e8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d0e8d0',
  },
  addPhotoButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#2E8B57',
  },
  photosLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  photosLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
}); 