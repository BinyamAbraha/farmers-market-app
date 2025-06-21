import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Dimensions,
  Image,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { MapScreenNavigationProp } from '../types/navigation';
import { useMarketData } from '../hooks/useMarketData';
import { marketService } from '../services/supabase';

const { width: screenWidth } = Dimensions.get('window');

interface HeroItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
}

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  count?: number;
  color: string;
}

interface Vendor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  image: string;
  followers: number;
}

interface SeasonalItem {
  id: string;
  name: string;
  image: string;
  peakWeeks: number;
  description: string;
}

const ExploreScreen: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<string>('');
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [marketCount, setMarketCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const heroCarouselRef = useRef<FlatList>(null);
  const navigation = useNavigation<MapScreenNavigationProp>();
  const { markets } = useMarketData();

  // Hero carousel data
  const heroItems: HeroItem[] = [
    {
      id: '1',
      title: 'Today\'s Fresh Picks',
      subtitle: 'Discover seasonal produce from local farms',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=400&fit=crop'
    },
    {
      id: '2', 
      title: 'Featured This Week',
      subtitle: 'Hand-picked markets with amazing vendors',
      image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&h=400&fit=crop'
    },
    {
      id: '3',
      title: 'Community Favorites',
      subtitle: 'Markets loved by your neighbors',
      image: 'https://images.unsplash.com/photo-1573246123716-6b1782bfc499?w=800&h=400&fit=crop'
    }
  ];

  // Quick actions data
  const quickActions: QuickAction[] = [
    { id: '1', title: 'Open Now', icon: 'storefront', count: 3, color: '#FF6B6B' },
    { id: '2', title: 'Closing Soon', icon: 'time', count: 2, color: '#FFA500' },
    { id: '3', title: 'Pre-Orders', icon: 'bag-handle', count: 8, color: '#4ECDC4' },
    { id: '4', title: 'Near You', icon: 'location', count: 12, color: '#45B7D1' },
  ];

  // Trending vendors data
  const trendingVendors: Vendor[] = [
    {
      id: '1',
      name: 'Green Valley Farm',
      specialty: 'Organic Vegetables',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=100&h=100&fit=crop&crop=face',
      followers: 1250
    },
    {
      id: '2',
      name: 'Sunrise Orchards',
      specialty: 'Fresh Fruits',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1607532941433-304659e8198a?w=100&h=100&fit=crop&crop=face',
      followers: 890
    },
    {
      id: '3',
      name: 'Artisan Breads Co',
      specialty: 'Baked Goods',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop&crop=face',
      followers: 2100
    }
  ];

  // Seasonal items data
  const seasonalItems: SeasonalItem[] = [
    {
      id: '1',
      name: 'Strawberries',
      image: 'https://images.unsplash.com/photo-1543528176-61b239494933?w=80&h=80&fit=crop',
      peakWeeks: 2,
      description: 'Sweet summer strawberries at their peak'
    },
    {
      id: '2',
      name: 'Asparagus',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=80&h=80&fit=crop',
      peakWeeks: 4,
      description: 'Fresh spring asparagus spears'
    },
    {
      id: '3',
      name: 'Heirloom Tomatoes',
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=80&h=80&fit=crop',
      peakWeeks: 6,
      description: 'Colorful varieties in full season'
    }
  ];

  useEffect(() => {
    initializeScreen();
    startHeroCarousel();
  }, []);

  useEffect(() => {
    setMarketCount(markets.length || 140); // Fallback to sample count
  }, [markets]);

  const initializeScreen = async () => {
    try {
      await getUserLocation();
      await loadMarketData();
    } catch (error) {
      console.error('Error initializing screen:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          setUserLocation(address.city || address.subregion || 'Your Area');
        }
      }
    } catch (error) {
      console.error('Location error:', error);
      setUserLocation('Your Area');
    }
  };

  const loadMarketData = async () => {
    try {
      const supabaseMarkets = await marketService.getAllMarkets();
      setMarketCount(supabaseMarkets.length || 140);
    } catch (error) {
      console.error('Market data error:', error);
    }
  };

  const startHeroCarousel = () => {
    setInterval(() => {
      setCurrentHeroIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % heroItems.length;
        heroCarouselRef.current?.scrollToIndex({ 
          index: nextIndex, 
          animated: true 
        });
        return nextIndex;
      });
    }, 4000);
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      await loadMarketData();
      await getUserLocation();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleQuickAction = async (action: QuickAction) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Handle quick action navigation
    console.log('Quick action pressed:', action.title);
  };

  const handleViewMap = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to map view
    navigation.navigate('MapView');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning!';
    if (hour < 17) return 'Good afternoon!';
    return 'Good evening!';
  };

  const getOpenMarketsCount = () => {
    // This would be calculated based on current time and market hours
    return Math.floor(Math.random() * 5) + 1; // Sample count
  };

  // Header Component
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.greeting}>
          {getGreeting()} {getOpenMarketsCount()} markets open now
        </Text>
        <Text style={styles.locationText}>
          Markets near {userLocation || 'you'}
        </Text>
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color="#2E8B57" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#2E8B57" />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>2</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Hero Carousel Component
  const renderHeroCarousel = () => (
    <View style={styles.heroSection}>
      <FlatList
        ref={heroCarouselRef}
        data={heroItems}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
          setCurrentHeroIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={styles.heroItem}>
            <Image source={{ uri: item.image }} style={styles.heroImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.heroGradient}
            />
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>{item.title}</Text>
              <Text style={styles.heroSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />
      <View style={styles.heroPagination}>
        {heroItems.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentHeroIndex && styles.paginationDotActive
            ]}
          />
        ))}
      </View>
    </View>
  );

  // Quick Actions Component
  const renderQuickActions = () => (
    <View style={styles.section}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickActionsContainer}
        decelerationRate="fast"
        snapToInterval={100}
      >
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.quickActionButton, { borderColor: action.color }]}
            onPress={() => handleQuickAction(action)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
              <Ionicons name={action.icon as any} size={20} color="#fff" />
            </View>
            <Text style={styles.quickActionTitle}>{action.title}</Text>
            {action.count && (
              <View style={styles.quickActionBadge}>
                <Text style={styles.quickActionBadgeText}>{action.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Map Access Button Component
  const renderMapButton = () => (
    <View style={styles.section}>
      <TouchableOpacity style={styles.mapButton} onPress={handleViewMap}>
        <View style={styles.mapButtonContent}>
          <View style={styles.mapButtonIcon}>
            <Ionicons name="map" size={24} color="#2E8B57" />
          </View>
          <View style={styles.mapButtonText}>
            <Text style={styles.mapButtonTitle}>🗺️ View Map</Text>
            <Text style={styles.mapButtonSubtitle}>View {marketCount} markets on map</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </View>
      </TouchableOpacity>
    </View>
  );

  // Trending Vendors Component
  const renderTrendingVendors = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🔥 Trending This Week</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllButton}>See All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.vendorsContainer}
      >
        {trendingVendors.map((vendor) => (
          <TouchableOpacity key={vendor.id} style={styles.vendorCard}>
            <Image source={{ uri: vendor.image }} style={styles.vendorImage} />
            <Text style={styles.vendorName}>{vendor.name}</Text>
            <Text style={styles.vendorSpecialty}>{vendor.specialty}</Text>
            <View style={styles.vendorStats}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.ratingText}>{vendor.rating}</Text>
              </View>
              <TouchableOpacity style={styles.followButton}>
                <Text style={styles.followButtonText}>Follow</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Seasonal Items Component
  const renderSeasonalItems = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🌱 What's in Season</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllButton}>Learn More</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.seasonalContainer}
      >
        {seasonalItems.map((item) => (
          <TouchableOpacity key={item.id} style={styles.seasonalCard}>
            <Image source={{ uri: item.image }} style={styles.seasonalImage} />
            <View style={styles.seasonalContent}>
              <Text style={styles.seasonalName}>{item.name}</Text>
              <Text style={styles.seasonalDescription}>{item.description}</Text>
              <Text style={styles.seasonalTimer}>
                Peak season: {item.peakWeeks} weeks left
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Community Preview Component
  const renderCommunityPreview = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>👥 From Your Community</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllButton}>View All</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.communityCard}>
        <View style={styles.communityPlaceholder}>
          <Ionicons name="camera-outline" size={32} color="#999" />
          <Text style={styles.communityPlaceholderText}>
            Share Your Market Experience
          </Text>
          <Text style={styles.communityPlaceholderSubtext}>
            Connect with other market lovers in your area
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E8B57" />
          <Text style={styles.loadingText}>Loading fresh content...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#2E8B57']}
            tintColor="#2E8B57"
          />
        }
      >
        {renderHeader()}
        {renderHeroCarousel()}
        {renderQuickActions()}
        {renderMapButton()}
        {renderTrendingVendors()}
        {renderSeasonalItems()}
        {renderCommunityPreview()}
        
        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },

  // Hero Carousel Styles
  heroSection: {
    height: 200,
    marginVertical: 8,
  },
  heroItem: {
    width: screenWidth,
    height: 200,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  heroPagination: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 3,
  },
  paginationDotActive: {
    backgroundColor: '#fff',
  },

  // Section Styles
  section: {
    marginVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  seeAllButton: {
    fontSize: 14,
    color: '#2E8B57',
    fontWeight: '500',
  },

  // Quick Actions Styles
  quickActionsContainer: {
    paddingHorizontal: 16,
  },
  quickActionButton: {
    alignItems: 'center',
    marginRight: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    minWidth: 80,
    position: 'relative',
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  quickActionBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },

  // Map Button Styles
  mapButton: {
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  mapButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mapButtonText: {
    flex: 1,
  },
  mapButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  mapButtonSubtitle: {
    fontSize: 14,
    color: '#666',
  },

  // Vendor Cards Styles
  vendorsContainer: {
    paddingHorizontal: 16,
  },
  vendorCard: {
    width: 120,
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vendorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignSelf: 'center',
    marginBottom: 8,
  },
  vendorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  vendorSpecialty: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  vendorStats: {
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  followButton: {
    backgroundColor: '#f0f8f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  followButtonText: {
    fontSize: 12,
    color: '#2E8B57',
    fontWeight: '500',
  },

  // Seasonal Items Styles
  seasonalContainer: {
    paddingHorizontal: 16,
  },
  seasonalCard: {
    width: 200,
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  seasonalImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
  },
  seasonalContent: {
    padding: 12,
  },
  seasonalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  seasonalDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  seasonalTimer: {
    fontSize: 11,
    color: '#FF6B6B',
    fontWeight: '500',
  },

  // Community Styles
  communityCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  communityPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  communityPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
  },
  communityPlaceholderSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },

  bottomSpacing: {
    height: 100,
  },
});

export default ExploreScreen;