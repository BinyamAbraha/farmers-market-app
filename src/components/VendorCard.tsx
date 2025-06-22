import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Vendor } from '../services/supabase';
import { useVendorFollow } from '../hooks/useVendorFollow';

interface VendorCardProps {
  vendor: Vendor;
  onPress: (vendor: Vendor) => void;
  style?: any;
  showDistance?: boolean;
  distance?: string;
}

const VendorCard: React.FC<VendorCardProps> = ({
  vendor,
  onPress,
  style,
  showDistance = false,
  distance
}) => {
  const { isFollowing, toggleFollow, isLoading, followCounts } = useVendorFollow();

  const handleFollowPress = async (e: any) => {
    e.stopPropagation();
    try {
      await toggleFollow(vendor.id);
    } catch (error) {
      console.error('Follow action failed:', error);
    }
  };

  const formatFollowerCount = (count: number): string => {
    const displayCount = followCounts[vendor.id] ?? count;
    if (displayCount >= 1000) {
      return `${(displayCount / 1000).toFixed(1)}k`;
    }
    return displayCount.toString();
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

  const following = isFollowing(vendor.id);
  const loading = isLoading(vendor.id);

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={() => onPress(vendor)}
      activeOpacity={0.8}
    >
      {/* Vendor Image */}
      <View style={styles.imageContainer}>
        {vendor.profile_photo_url || vendor.cover_photo_url ? (
          <Image
            source={{ uri: vendor.profile_photo_url || vendor.cover_photo_url }}
            style={styles.vendorImage}
            onError={() => {
              // Handle image load error silently
            }}
          />
        ) : (
          <View style={[styles.vendorImagePlaceholder, { backgroundColor: getVendorColor(vendor.name) }]}>
            <Text style={styles.vendorInitials}>
              {getVendorInitials(vendor.name)}
            </Text>
          </View>
        )}
        
        {/* Verified Badge */}
        {vendor.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#2E8B57" />
          </View>
        )}
      </View>

      {/* Vendor Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.vendorName} numberOfLines={1}>
          {vendor.name}
        </Text>
        
        <Text style={styles.specialty} numberOfLines={1}>
          {vendor.specialty || vendor.specialties?.[0] || 'Local Vendor'}
        </Text>

        {/* Rating and Distance */}
        <View style={styles.statsRow}>
          <View style={styles.rating}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.ratingText}>{vendor.rating.toFixed(1)}</Text>
          </View>
          
          {showDistance && distance && (
            <>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.distanceText}>{distance}</Text>
            </>
          )}
        </View>

        {/* Follower Count */}
        <Text style={styles.followerCount}>
          {formatFollowerCount(vendor.follower_count)} followers
        </Text>
      </View>

      {/* Follow Button */}
      <TouchableOpacity
        style={[
          styles.followButton,
          following && styles.followButtonActive
        ]}
        onPress={handleFollowPress}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color={following ? "#fff" : "#2E8B57"} />
        ) : (
          <>
            {following ? (
              <LinearGradient
                colors={['#2E8B57', '#90EE90']}
                style={styles.followButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="checkmark" size={14} color="#fff" />
                <Text style={styles.followButtonTextActive}>Following</Text>
              </LinearGradient>
            ) : (
              <View style={styles.followButtonInner}>
                <Ionicons name="person-add" size={14} color="#2E8B57" />
                <Text style={styles.followButtonText}>Follow</Text>
              </View>
            )}
          </>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 8,
  },
  vendorImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f0f0f0',
  },
  vendorImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vendorInitials: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 45,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  vendorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  specialty: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 2,
  },
  separator: {
    fontSize: 11,
    color: '#ccc',
    marginHorizontal: 4,
  },
  distanceText: {
    fontSize: 11,
    color: '#666',
  },
  followerCount: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  followButton: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2E8B57',
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followButtonActive: {
    borderColor: 'transparent',
  },
  followButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    height: 30,
  },
  followButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2E8B57',
    marginLeft: 4,
  },
  followButtonTextActive: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
    marginLeft: 4,
  },
});

export default VendorCard;