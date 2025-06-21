import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PhotoCard from '../components/PhotoCard';
import FilterChip, { FilterOption } from '../components/FilterChip';
import PhotoCapture from '../components/PhotoCapture';
import PhotoUpload from '../components/PhotoUpload';
import { MarketPhoto, photoService } from '../services/supabase';

type PhotoFilter = 'recent' | 'popular';

const PHOTO_FILTERS: FilterOption[] = [
  { key: 'recent', label: 'Recent', icon: 'time' },
  { key: 'popular', label: 'Popular', icon: 'trending-up' },
];

const PhotoHubScreen = memo(() => {
  const [photos, setPhotos] = useState<MarketPhoto[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<PhotoFilter>('recent');
  const [refreshing, setRefreshing] = useState(false);
  
  // Photo capture/upload states
  const [captureVisible, setCaptureVisible] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string>('');

  useEffect(() => {
    loadPhotos();
  }, [selectedFilter]);

  const loadPhotos = async () => {
    try {
      // Load all photos regardless of filter for now
      const photosData = await photoService.getAllPhotos(100);
      
      // Sort by creation date (newest first) or by likes count for popular
      if (selectedFilter === 'popular') {
        photosData.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
      } else {
        photosData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
      
      setPhotos(photosData);
    } catch (error) {
      console.error('Error loading photos:', error);
      Alert.alert('Error', 'Failed to load photos. Please try again.');
    } finally {
      // Loading state removed for simplicity
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPhotos();
    setRefreshing(false);
  };

  const handleFilterChange = (filterKey: string) => {
    setSelectedFilter(filterKey as PhotoFilter);
  };

  const handlePhotoSelected = (uri: string) => {
    setSelectedPhotoUri(uri);
    setUploadVisible(true);
  };

  const handleUploadComplete = (photo: MarketPhoto) => {
    setPhotos(prev => [photo, ...prev]);
    Alert.alert('Success', 'Photo shared successfully!');
  };

  const handlePhotoPress = useCallback((photo: MarketPhoto) => {
    // TODO: Open photo detail view/lightbox
    console.log('Photo pressed:', photo.id);
  }, []);

  const renderPhotoCard = useCallback(({ item, index }: { item: MarketPhoto; index: number }) => {
    if (!item || !item.id) return null;
    return (
      <PhotoCard
        photo={item}
        onPress={() => handlePhotoPress(item)}
        showMetadata={true}
      />
    );
  }, [handlePhotoPress]);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Market Community</Text>
        <TouchableOpacity 
          onPress={() => setCaptureVisible(true)}
          style={styles.addPhotoButton}
        >
          <Ionicons name="camera" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.headerSubtitle}>
        Share your farmers market discoveries
      </Text>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersList}
      >
        {PHOTO_FILTERS.map((filter) => (
          <FilterChip
            key={filter.key}
            filter={filter}
            isSelected={selectedFilter === filter.key}
            onPress={handleFilterChange}
            variant="outline"
          />
        ))}
      </ScrollView>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{photos.length}</Text>
        <Text style={styles.statLabel}>Photos</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>
          {photos.reduce((sum, photo) => sum + (photo.likes_count || 0), 0)}
        </Text>
        <Text style={styles.statLabel}>Likes</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>
          {new Set(photos.map(p => p.market_id)).size}
        </Text>
        <Text style={styles.statLabel}>Markets</Text>
      </View>
    </View>
  );

  const renderAddPhotoCTA = () => (
    <TouchableOpacity 
      style={styles.addPhotoCTA} 
      onPress={() => setCaptureVisible(true)}
    >
      <View style={styles.addPhotoIcon}>
        <Ionicons name="camera-outline" size={32} color="#2E8B57" />
      </View>
      <View style={styles.addPhotoContent}>
        <Text style={styles.addPhotoTitle}>Share Your Market Experience</Text>
        <Text style={styles.addPhotoSubtitle}>
          Show off your fresh finds, favorite vendors, or the market atmosphere!
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#2E8B57" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      {/* Use FlatList with header components instead of ScrollView */}
      <FlatList
        data={photos}
        renderItem={renderPhotoCard}
        keyExtractor={(item) => item?.id || Math.random().toString()}
        numColumns={3}
        style={styles.content}
        contentContainerStyle={styles.gridContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={15}
        updateCellsBatchingPeriod={100}
        initialNumToRender={12}
        windowSize={10}
        ListHeaderComponent={
          <View>
            {renderFilters()}
            {renderStats()}
            {renderAddPhotoCTA()}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="camera-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Photos Yet</Text>
            <Text style={styles.emptySubtitle}>
              Be the first to share photos from the farmers market!
            </Text>
          </View>
        }
      />

      {/* Photo Capture Modal */}
      <PhotoCapture
        visible={captureVisible}
        onClose={() => setCaptureVisible(false)}
        onPhotoSelected={handlePhotoSelected}
        marketId="community"
      />

      {/* Photo Upload Modal */}
      <PhotoUpload
        visible={uploadVisible}
        onClose={() => setUploadVisible(false)}
        onUploadComplete={handleUploadComplete}
        photoUri={selectedPhotoUri}
        marketId="community"
      />
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#2E8B57',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  addPhotoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
  },
  filtersContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filtersList: {
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    marginHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E8B57',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  addPhotoCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    padding: 20,
    backgroundColor: '#e8f5e8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d0e8d0',
  },
  addPhotoIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  addPhotoContent: {
    flex: 1,
  },
  addPhotoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  addPhotoSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  photoGrid: {
    paddingHorizontal: 12,
  },
  gridContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
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
});

export default PhotoHubScreen;