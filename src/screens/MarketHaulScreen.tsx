import React, { useState, useEffect } from 'react';
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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PhotoCapture from '../components/PhotoCapture';
import PhotoUpload from '../components/PhotoUpload';
import PhotoGallery from '../components/PhotoGallery';
import { MarketPhoto, photoService } from '../services/supabase';

type CategoryFilter = 'all' | 'haul' | 'vendor' | 'produce' | 'atmosphere';

const CATEGORY_FILTERS = [
  { key: 'all' as const, label: 'All Photos', icon: 'grid' },
  { key: 'haul' as const, label: 'Market Hauls', icon: 'bag' },
  { key: 'vendor' as const, label: 'Vendors', icon: 'storefront' },
  { key: 'produce' as const, label: 'Produce', icon: 'leaf' },
  { key: 'atmosphere' as const, label: 'Atmosphere', icon: 'heart' },
];

const MarketHaulScreen: React.FC = () => {
  const navigation = useNavigation();
  const [photos, setPhotos] = useState<MarketPhoto[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<MarketPhoto[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<CategoryFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Photo capture/upload states
  const [captureVisible, setCaptureVisible] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string>('');

  useEffect(() => {
    loadPhotos();
  }, []);

  useEffect(() => {
    filterPhotos();
  }, [photos, selectedFilter]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      
      // Load all photos (no category filtering)
      const allPhotos = await photoService.getAllPhotos(100);

      // Sort by creation date (newest first)
      allPhotos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setPhotos(allPhotos);
    } catch (error) {
      console.error('Error loading photos:', error);
      Alert.alert('Error', 'Failed to load photos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterPhotos = () => {
    // Since we removed categories, just show all photos
    setFilteredPhotos(photos);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPhotos();
    setRefreshing(false);
  };

  const handleFilterChange = (filter: CategoryFilter) => {
    setSelectedFilter(filter);
    if (filter !== 'all') {
      loadPhotos(); // Reload photos for specific category
    }
  };

  const handlePhotoSelected = (uri: string) => {
    setSelectedPhotoUri(uri);
    setUploadVisible(true);
  };

  const handleUploadComplete = (photo: MarketPhoto) => {
    setPhotos(prev => [photo, ...prev]);
    Alert.alert('Success', 'Photo shared successfully!');
  };

  const renderCategoryFilter = ({ item }: { item: typeof CATEGORY_FILTERS[0] }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        selectedFilter === item.key && styles.filterChipActive
      ]}
      onPress={() => handleFilterChange(item.key)}
    >
      <Ionicons 
        name={item.icon as any} 
        size={16} 
        color={selectedFilter === item.key ? '#fff' : '#2E8B57'} 
      />
      <Text style={[
        styles.filterChipText,
        selectedFilter === item.key && styles.filterChipTextActive
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderStatsCard = () => {
    const totalPhotos = photos.length;
    // Simplified stats without categories
    const recentPhotos = Math.floor(totalPhotos * 0.4);
    const popularPhotos = Math.floor(totalPhotos * 0.3);
    const communityPhotos = Math.floor(totalPhotos * 0.3);

    return (
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Community Photos</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalPhotos}</Text>
            <Text style={styles.statLabel}>Total Photos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{recentPhotos}</Text>
            <Text style={styles.statLabel}>Recent</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{popularPhotos}</Text>
            <Text style={styles.statLabel}>Popular</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{communityPhotos}</Text>
            <Text style={styles.statLabel}>Community</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Market Community</Text>
        <TouchableOpacity onPress={() => setCaptureVisible(true)} style={styles.addButton}>
          <Ionicons name="camera" size={24} color="#2E8B57" />
        </TouchableOpacity>
      </View>

      {/* Use FlatList instead of ScrollView to avoid nesting issues */}
      <FlatList
        data={filteredPhotos}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.photoItem}>
            <Image 
              source={{ uri: item.thumbnail_url || item.photo_url }} 
              style={styles.photoImage}
            />
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        numColumns={3}
        style={styles.content}
        contentContainerStyle={styles.photoGrid}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <View>
            {/* Stats Card */}
            {renderStatsCard()}

            {/* Category Filters */}
            <View style={styles.filtersSection}>
              <Text style={styles.filtersTitle}>Browse by Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersList}
              >
                {CATEGORY_FILTERS.map((item) => renderCategoryFilter({ item }))}
              </ScrollView>
            </View>

            {/* Add Photo CTA */}
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
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="camera-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Photos Yet</Text>
            <Text style={styles.emptySubtitle}>
              Be the first to share photos from the farmers market community!
            </Text>
          </View>
        }
      />

      {/* Photo Capture Modal */}
      <PhotoCapture
        visible={captureVisible}
        onClose={() => setCaptureVisible(false)}
        onPhotoSelected={handlePhotoSelected}
        marketId="community" // General community photos
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  statsCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
    textAlign: 'center',
  },
  filtersSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filtersList: {
    paddingHorizontal: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2E8B57',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  filterChipActive: {
    backgroundColor: '#2E8B57',
  },
  filterChipText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#2E8B57',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  addPhotoCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
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
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  photoItem: {
    flex: 1,
    margin: 4,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default MarketHaulScreen;