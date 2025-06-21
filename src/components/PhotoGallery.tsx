import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  ActivityIndicator,
  Alert,
  Share,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketPhoto, photoService } from '../services/supabase';

interface PhotoGalleryProps {
  photos: MarketPhoto[];
  onRefresh?: () => void;
  refreshing?: boolean;
  marketName?: string;
}

interface LightboxProps {
  visible: boolean;
  photos: MarketPhoto[];
  initialIndex: number;
  onClose: () => void;
  onLike: (photoId: string) => void;
  onReport: (photoId: string) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const PHOTO_SIZE = (screenWidth - 48) / 3; // 3 columns with padding

const PhotoLightbox: React.FC<LightboxProps> = ({
  visible,
  photos,
  initialIndex,
  onClose,
  onLike,
  onReport,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showDetails, setShowDetails] = useState(true);
  const [liked, setLiked] = useState(false);
  const scaleValue = new Animated.Value(1);

  const currentPhoto = photos?.[currentIndex];

  // Pan responder for swipe gestures
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
    },
    onPanResponderRelease: (_, gestureState) => {
      if (!photos || photos.length === 0) return;
      if (Math.abs(gestureState.dx) > 50) {
        if (gestureState.dx > 0 && currentIndex > 0) {
          // Swipe right - previous photo
          setCurrentIndex(currentIndex - 1);
        } else if (gestureState.dx < 0 && currentIndex < photos.length - 1) {
          // Swipe left - next photo
          setCurrentIndex(currentIndex + 1);
        }
      }
    },
  });

  const handleLike = useCallback(async () => {
    if (!currentPhoto?.id) return;
    try {
      setLiked(!liked);
      await onLike(currentPhoto.id);
    } catch (error) {
      setLiked(liked); // Revert on error
      Alert.alert('Error', 'Failed to like photo');
    }
  }, [currentPhoto?.id, liked, onLike]);

  const handleShare = useCallback(async () => {
    if (!currentPhoto) return;
    try {
      await Share.share({
        message: `Check out this photo from the farmers market! "${currentPhoto.caption || 'Farmers Market Photo'}"`,
        url: currentPhoto.photo_url || '',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  }, [currentPhoto]);

  const handleReport = useCallback(() => {
    if (!currentPhoto?.id) return;
    Alert.alert(
      'Report Photo',
      'Why are you reporting this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Inappropriate Content', onPress: () => onReport(currentPhoto.id) },
        { text: 'Spam', onPress: () => onReport(currentPhoto.id) },
        { text: 'Copyright Violation', onPress: () => onReport(currentPhoto.id) },
      ]
    );
  }, [currentPhoto?.id, onReport]);

  const toggleDetails = useCallback(() => {
    setShowDetails(!showDetails);
  }, [showDetails]);

  if (!currentPhoto) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.lightboxOverlay}>
        {/* Header */}
        <View style={[styles.lightboxHeader, !showDetails && styles.lightboxHeaderHidden]}>
          <TouchableOpacity onPress={onClose} style={styles.lightboxCloseButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.lightboxCounter}>
            {currentIndex + 1} of {photos?.length || 0}
          </Text>
          <TouchableOpacity onPress={handleReport} style={styles.lightboxReportButton}>
            <Ionicons name="flag" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Photo */}
        <TouchableOpacity 
          style={styles.lightboxImageContainer} 
          onPress={toggleDetails}
          activeOpacity={1}
          {...panResponder.panHandlers}
        >
          <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
            <Image 
              source={{ uri: currentPhoto?.photo_url || '' }} 
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          </Animated.View>
        </TouchableOpacity>

        {/* Footer */}
        <View style={[styles.lightboxFooter, !showDetails && styles.lightboxFooterHidden]}>
          <View style={styles.lightboxContent}>
            <Text style={styles.lightboxCaption}>{currentPhoto?.caption || 'No caption'}</Text>
            
            {/* Tags */}
            {currentPhoto?.tags && currentPhoto.tags.length > 0 && (
              <View style={styles.lightboxTags}>
                {currentPhoto.tags.map((tag, index) => (
                  <Text key={index} style={styles.lightboxTag}>#{tag}</Text>
                ))}
              </View>
            )}
            
            {/* Photo info */}
            <View style={styles.lightboxCategoryBadge}>
              <Text style={styles.lightboxCategoryText}>Farmers Market</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.lightboxActions}>
            <TouchableOpacity onPress={handleLike} style={styles.lightboxActionButton}>
              <Ionicons 
                name={liked ? "heart" : "heart-outline"} 
                size={24} 
                color={liked ? "#E74C3C" : "#fff"} 
              />
              <Text style={styles.lightboxActionText}>{currentPhoto.likes_count}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleShare} style={styles.lightboxActionButton}>
              <Ionicons name="share-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Navigation dots */}
        {photos.length > 1 && (
          <View style={styles.lightboxDots}>
            {photos.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.lightboxDot,
                  index === currentIndex && styles.lightboxDotActive
                ]}
                onPress={() => setCurrentIndex(index)}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
};

const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  onRefresh,
  refreshing = false,
  marketName,
}) => {
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxVisible(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxVisible(false);
  }, []);

  const handleLike = useCallback(async (photoId: string) => {
    try {
      await photoService.togglePhotoLike(photoId, 'current-user-id');
      // Refresh photos to get updated like count
      onRefresh?.();
    } catch (error) {
      console.error('Like error:', error);
      throw error;
    }
  }, [onRefresh]);

  const handleReport = useCallback(async (photoId: string) => {
    try {
      await photoService.reportPhoto(photoId, 'current-user-id', 'inappropriate');
      Alert.alert('Thank you', 'Photo has been reported and will be reviewed.');
    } catch (error) {
      console.error('Report error:', error);
      Alert.alert('Error', 'Failed to report photo');
    }
  }, []);

  const renderPhoto = useCallback(({ item, index }: { item: MarketPhoto; index: number }) => (
    <TouchableOpacity
      style={styles.photoItem}
      onPress={() => openLightbox(index)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.thumbnail_url || item.photo_url }} style={styles.photoThumbnail} />
      
      {/* Photo overlay with category and likes */}
      <View style={styles.photoOverlay}>
        <View style={styles.photoCategoryBadge}>
          <Text style={styles.photoCategoryText}>📸</Text>
        </View>
        <View style={styles.photoLikes}>
          <Ionicons name="heart" size={12} color="#fff" />
          <Text style={styles.photoLikesText}>{item.likes_count}</Text>
        </View>
      </View>
    </TouchableOpacity>
  ), [openLightbox]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="camera-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Photos Yet</Text>
      <Text style={styles.emptySubtitle}>
        Be the first to share a photo of {marketName || 'this market'}!
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Market Photos</Text>
      <Text style={styles.headerSubtitle}>{photos.length} photos</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        onRefresh={onRefresh}
        refreshing={refreshing}
        showsVerticalScrollIndicator={false}
      />

      <PhotoLightbox
        visible={lightboxVisible}
        photos={photos}
        initialIndex={lightboxIndex}
        onClose={closeLightbox}
        onLike={handleLike}
        onReport={handleReport}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  grid: {
    padding: 12,
  },
  photoItem: {
    margin: 4,
    position: 'relative',
  },
  photoThumbnail: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 8,
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    justifyContent: 'space-between',
    padding: 8,
  },
  photoCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(46, 139, 87, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  photoCategoryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
  photoLikes: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  photoLikesText: {
    color: '#fff',
    fontSize: 10,
    marginLeft: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 200,
  },

  // Lightbox styles
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  lightboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 16,
  },
  lightboxHeaderHidden: {
    opacity: 0,
  },
  lightboxCloseButton: {
    padding: 8,
  },
  lightboxCounter: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  lightboxReportButton: {
    padding: 8,
  },
  lightboxImageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImage: {
    width: screenWidth,
    height: screenHeight * 0.7,
  },
  lightboxFooter: {
    paddingHorizontal: 16,
    paddingBottom: 44,
  },
  lightboxFooterHidden: {
    opacity: 0,
  },
  lightboxContent: {
    marginBottom: 16,
  },
  lightboxCaption: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
  lightboxTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  lightboxTag: {
    color: '#4A90E2',
    fontSize: 14,
    marginRight: 8,
    marginBottom: 4,
  },
  lightboxCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(46, 139, 87, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lightboxCategoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  lightboxActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  lightboxActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  lightboxActionText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 4,
  },
  lightboxDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  lightboxDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 3,
  },
  lightboxDotActive: {
    backgroundColor: '#fff',
  },
});

export default PhotoGallery;