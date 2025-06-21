import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketPhoto } from '../services/supabase';

const { width: screenWidth } = Dimensions.get('window');
const CARD_SIZE = (screenWidth - 48) / 3; // 3 columns with padding

interface PhotoCardProps {
  photo: MarketPhoto;
  onPress: () => void;
  showMetadata?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  onPress,
  showMetadata = true,
  size = 'medium',
}) => {
  const getCardSize = () => {
    switch (size) {
      case 'small':
        return CARD_SIZE * 0.8;
      case 'large':
        return CARD_SIZE * 1.2;
      default:
        return CARD_SIZE;
    }
  };

  const cardSize = getCardSize();

  // Simplified without categories
  const getPhotoIcon = () => 'camera';
  const getPhotoColor = () => '#2E8B57';

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardSize, height: cardSize }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: photo.thumbnail_url || photo.photo_url }}
        style={styles.image}
        resizeMode="cover"
      />
      
      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Category Badge */}
        <View style={[
          styles.categoryBadge,
          { backgroundColor: getPhotoColor() }
        ]}>
          <Ionicons
            name={getPhotoIcon() as any}
            size={10}
            color="#fff"
          />
        </View>

        {/* Like Count */}
        <View style={styles.likesBadge}>
          <Ionicons name="heart" size={10} color="#fff" />
          <Text style={styles.likesText}>{photo.likes_count || 0}</Text>
        </View>
      </View>

      {/* Metadata */}
      {showMetadata && (
        <View style={styles.metadata}>
          <Text style={styles.marketName} numberOfLines={1}>
            Market Name
          </Text>
          <Text style={styles.userName} numberOfLines={1}>
            @username
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 4,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: '70%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 6,
    flexDirection: 'row',
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  likesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  likesText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 2,
  },
  metadata: {
    padding: 6,
    height: '30%',
    justifyContent: 'center',
  },
  marketName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  userName: {
    fontSize: 9,
    color: '#666',
  },
});

export default PhotoCard;