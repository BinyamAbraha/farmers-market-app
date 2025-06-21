import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface MarketCardData {
  id: number | string;
  name: string;
  address: string;
  distance?: string;
  rating?: number;
  isOpen: boolean;
  phone?: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  organic?: boolean;
  acceptsSnap?: boolean;
  petFriendly?: boolean;
}

interface MarketCardProps {
  market: MarketCardData;
  onPress: () => void;
  onCall?: () => void;
  onDirections?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
  showQuickActions?: boolean;
}

const MarketCard: React.FC<MarketCardProps> = ({
  market,
  onPress,
  onCall,
  onDirections,
  onFavorite,
  isFavorite = false,
  showQuickActions = true,
}) => {
  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={12}
            color="#FFD700"
          />
        ))}
      </View>
    );
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.marketName} numberOfLines={1}>
            {market.name}
          </Text>
          <Text style={styles.marketAddress} numberOfLines={1}>
            {market.address}
          </Text>
          {market.distance && (
            <Text style={styles.distance}>{market.distance}</Text>
          )}
        </View>
        
        <View style={styles.cardMeta}>
          {market.rating && renderStars(market.rating)}
          <View style={[
            styles.statusBadge,
            { backgroundColor: market.isOpen ? '#4CAF50' : '#F44336' }
          ]}>
            <View style={[
              styles.statusDot,
              { backgroundColor: market.isOpen ? '#81C784' : '#EF5350' }
            ]} />
            <Text style={styles.statusText}>
              {market.isOpen ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>
      </View>

      {/* Badges */}
      <View style={styles.badgesContainer}>
        {market.organic && (
          <View style={[styles.badge, styles.organicBadge]}>
            <Text style={styles.badgeText}>Organic</Text>
          </View>
        )}
        {market.acceptsSnap && (
          <View style={[styles.badge, styles.snapBadge]}>
            <Text style={styles.badgeText}>SNAP</Text>
          </View>
        )}
        {market.petFriendly && (
          <View style={[styles.badge, styles.petBadge]}>
            <Text style={styles.badgeText}>Pet OK</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      {showQuickActions && (
        <View style={styles.quickActions}>
          {market.phone && onCall && (
            <TouchableOpacity style={styles.quickAction} onPress={onCall}>
              <Ionicons name="call" size={16} color="#2E8B57" />
              <Text style={styles.quickActionText}>Call</Text>
            </TouchableOpacity>
          )}
          {onDirections && (
            <TouchableOpacity style={styles.quickAction} onPress={onDirections}>
              <Ionicons name="navigate" size={16} color="#2E8B57" />
              <Text style={styles.quickActionText}>Directions</Text>
            </TouchableOpacity>
          )}
          {onFavorite && (
            <TouchableOpacity style={styles.quickAction} onPress={onFavorite}>
              <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={16} 
                color={isFavorite ? "#E74C3C" : "#2E8B57"} 
              />
              <Text style={styles.quickActionText}>
                {isFavorite ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  marketName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  marketAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  distance: {
    fontSize: 12,
    color: '#2E8B57',
    fontWeight: '500',
  },
  cardMeta: {
    alignItems: 'flex-end',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
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
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  quickActionText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#2E8B57',
    fontWeight: '500',
  },
});

export default MarketCard;