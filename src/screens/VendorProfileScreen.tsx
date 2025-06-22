import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Vendor, vendorService } from '../services/supabase';
import { useVendorFollow } from '../hooks/useVendorFollow';
import { openMapsApp, makePhoneCall } from '../utils/deviceActions';

const { width: screenWidth } = Dimensions.get('window');

interface RouteParams {
  vendor?: Vendor;
  vendorId?: string;
}

type TabType = 'posts' | 'about' | 'reviews' | 'schedule';

const VendorProfileScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { vendor: initialVendor, vendorId } = (route.params as RouteParams) || {};
  
  const [vendor, setVendor] = useState<Vendor | null>(initialVendor || null);
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [loading, setLoading] = useState(!initialVendor);

  const { isFollowing, toggleFollow, isLoading, followCounts } = useVendorFollow();

  useEffect(() => {
    if (!vendor && vendorId) {
      loadVendor();
    }
  }, [vendorId]);

  const loadVendor = async () => {
    if (!vendorId) return;
    
    try {
      setLoading(true);
      // For development, use sample data
      const sampleVendors = vendorService.getSampleVendors();
      const foundVendor = sampleVendors.find(v => v.id === vendorId);
      
      if (foundVendor) {
        setVendor(foundVendor);
      } else {
        Alert.alert('Error', 'Vendor not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Load vendor error:', error);
      Alert.alert('Error', 'Failed to load vendor profile');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleFollowPress = async () => {
    if (!vendor) return;
    
    try {
      await toggleFollow(vendor.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const handleCallPress = async () => {
    if (!vendor?.phone) return;
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await makePhoneCall(vendor.phone);
  };

  const handleDirectionsPress = async () => {
    if (!vendor?.market_locations?.[0]) return;
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // For demo, use San Francisco coordinates
    await openMapsApp(37.7749, -122.4194, vendor.market_locations[0]);
  };

  const handleWebsitePress = async () => {
    if (!vendor?.website) return;
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Linking.openURL(vendor.website);
  };

  const handleSharePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Share', `Share ${vendor?.name} with your friends!`);
  };

  const handleTabPress = async (tab: TabType) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  // Generate vendor initials and color
  const getVendorInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getVendorColor = (name: string): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (loading || !vendor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading vendor profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const following = isFollowing(vendor.id);
  const followLoading = isLoading(vendor.id);
  const followerCount = followCounts[vendor.id] ?? vendor.follower_count;

  // Header Component
  const renderHeader = () => (
    <View style={styles.header}>
      {/* Cover Photo */}
      <View style={styles.coverContainer}>
        {vendor.cover_photo_url ? (
          <Image
            source={{ uri: vendor.cover_photo_url }}
            style={styles.coverPhoto}
            onError={() => {
              // Handle image load error silently
            }}
          />
        ) : (
          <LinearGradient
            colors={[getVendorColor(vendor.name), '#333']}
            style={styles.coverPhoto}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.coverGradient}
        />
        
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        {/* Share Button */}
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleSharePress}
        >
          <Ionicons name="share-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Profile Info */}
      <View style={styles.profileInfo}>
        <View style={styles.profileImageContainer}>
          {vendor.profile_photo_url ? (
            <Image
              source={{ uri: vendor.profile_photo_url }}
              style={styles.profileImage}
              onError={() => {
                // Handle image load error silently
              }}
            />
          ) : (
            <View style={[styles.profileImagePlaceholder, { backgroundColor: getVendorColor(vendor.name) }]}>
              <Text style={styles.profileInitials}>
                {getVendorInitials(vendor.name)}
              </Text>
            </View>
          )}
          {vendor.verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#2E8B57" />
            </View>
          )}
        </View>

        <View style={styles.profileDetails}>
          <Text style={styles.vendorName}>{vendor.name}</Text>
          <Text style={styles.specialty}>{vendor.specialty}</Text>
          
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.statText}>{vendor.rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>({vendor.review_count})</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.stat}>
              <Ionicons name="people" size={16} color="#666" />
              <Text style={styles.statText}>{followerCount}</Text>
              <Text style={styles.statLabel}>followers</Text>
            </View>
          </View>

          {/* Bio */}
          {vendor.bio && (
            <Text style={styles.bio} numberOfLines={3}>
              {vendor.bio}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  // Action Buttons Component
  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={[
          styles.followButton,
          following && styles.followButtonActive
        ]}
        onPress={handleFollowPress}
        disabled={followLoading}
      >
        {following ? (
          <LinearGradient
            colors={['#2E8B57', '#90EE90']}
            style={styles.followButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={styles.followButtonTextActive}>Following</Text>
          </LinearGradient>
        ) : (
          <View style={styles.followButtonInner}>
            <Ionicons name="person-add" size={18} color="#2E8B57" />
            <Text style={styles.followButtonText}>Follow</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={handleCallPress}>
        <Ionicons name="call" size={18} color="#2E8B57" />
        <Text style={styles.actionButtonText}>Call</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={handleDirectionsPress}>
        <Ionicons name="navigate" size={18} color="#2E8B57" />
        <Text style={styles.actionButtonText}>Directions</Text>
      </TouchableOpacity>

      {vendor.website && (
        <TouchableOpacity style={styles.actionButton} onPress={handleWebsitePress}>
          <Ionicons name="globe" size={18} color="#2E8B57" />
          <Text style={styles.actionButtonText}>Website</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Tab Navigation Component
  const renderTabNavigation = () => (
    <View style={styles.tabNavigation}>
      {[
        { key: 'posts', label: 'Posts', icon: 'grid' },
        { key: 'about', label: 'About', icon: 'information-circle' },
        { key: 'reviews', label: 'Reviews', icon: 'star' },
        { key: 'schedule', label: 'Schedule', icon: 'calendar' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tabButton,
            activeTab === tab.key && styles.tabButtonActive
          ]}
          onPress={() => handleTabPress(tab.key as TabType)}
        >
          <Ionicons
            name={tab.icon as any}
            size={20}
            color={activeTab === tab.key ? '#2E8B57' : '#999'}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === tab.key && styles.tabButtonTextActive
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Tab Content Component
  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return (
          <View style={styles.tabContent}>
            <View style={styles.emptyState}>
              <Ionicons name="images-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateTitle}>No posts yet</Text>
              <Text style={styles.emptyStateText}>
                {vendor.name} hasn't shared any photos yet
              </Text>
            </View>
          </View>
        );
      
      case 'about':
        return (
          <View style={styles.tabContent}>
            <View style={styles.aboutSection}>
              <Text style={styles.aboutTitle}>About {vendor.name}</Text>
              <Text style={styles.aboutText}>{vendor.bio}</Text>
              
              <View style={styles.infoRow}>
                <Ionicons name="storefront" size={20} color="#666" />
                <Text style={styles.infoText}>Specialties</Text>
              </View>
              <View style={styles.specialtiesContainer}>
                {vendor.specialties.map((specialty, index) => (
                  <View key={index} style={styles.specialtyTag}>
                    <Text style={styles.specialtyTagText}>{specialty}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="location" size={20} color="#666" />
                <Text style={styles.infoText}>Market Locations</Text>
              </View>
              {vendor.market_locations.map((location, index) => (
                <Text key={index} style={styles.locationText}>• {location}</Text>
              ))}
            </View>
          </View>
        );
      
      case 'reviews':
        return (
          <View style={styles.tabContent}>
            <View style={styles.emptyState}>
              <Ionicons name="star-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateTitle}>No reviews yet</Text>
              <Text style={styles.emptyStateText}>
                Be the first to review {vendor.name}
              </Text>
            </View>
          </View>
        );
      
      case 'schedule':
        return (
          <View style={styles.tabContent}>
            <View style={styles.scheduleSection}>
              <Text style={styles.aboutTitle}>Market Schedule</Text>
              {Object.entries(vendor.operating_hours || {}).map(([day, hours]) => (
                <View key={day} style={styles.scheduleRow}>
                  <Text style={styles.scheduleDay}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                  <Text style={styles.scheduleHours}>{hours as string}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderActionButtons()}
        {renderTabNavigation()}
        {renderTabContent()}
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
  
  // Header Styles
  header: {
    marginBottom: 16,
  },
  coverContainer: {
    height: 200,
    position: 'relative',
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  profileImageContainer: {
    position: 'relative',
    marginTop: -40,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileInitials: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileDetails: {
    flex: 1,
    marginLeft: 16,
    marginTop: -20,
  },
  vendorName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  specialty: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 12,
  },
  bio: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },

  // Action Buttons Styles
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  followButton: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2E8B57',
    marginRight: 8,
    overflow: 'hidden',
  },
  followButtonActive: {
    borderColor: 'transparent',
  },
  followButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  followButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E8B57',
    marginLeft: 6,
  },
  followButtonTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2E8B57',
    marginLeft: 4,
  },

  // Tab Navigation Styles
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  tabButtonActive: {
    backgroundColor: '#fff',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
    marginLeft: 4,
  },
  tabButtonTextActive: {
    color: '#2E8B57',
    fontWeight: '600',
  },

  // Tab Content Styles
  tabContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  aboutSection: {
    paddingBottom: 20,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  specialtyTag: {
    backgroundColor: '#f0f8f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  specialtyTagText: {
    fontSize: 12,
    color: '#2E8B57',
    fontWeight: '500',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 28,
    marginBottom: 4,
  },
  scheduleSection: {
    paddingBottom: 20,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  scheduleDay: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  scheduleHours: {
    fontSize: 14,
    color: '#666',
  },
});

export default VendorProfileScreen;