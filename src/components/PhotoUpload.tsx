import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { photoService, MarketPhoto } from '../services/supabase';

interface PhotoUploadProps {
  visible: boolean;
  onClose: () => void;
  onUploadComplete: (photo: MarketPhoto) => void;
  photoUri: string;
  marketId: string;
}

const PHOTO_CATEGORIES = [
  { key: 'haul' as const, label: 'Market Haul', icon: 'bag', description: 'Show off your fresh finds!' },
  { key: 'vendor' as const, label: 'Vendor Spotlight', icon: 'storefront', description: 'Highlight amazing vendors' },
  { key: 'produce' as const, label: 'Fresh Produce', icon: 'leaf', description: 'Beautiful fruits & vegetables' },
  { key: 'atmosphere' as const, label: 'Market Vibes', icon: 'heart', description: 'Capture the market atmosphere' },
];

const SUGGESTED_TAGS = [
  'organic', 'locally-grown', 'seasonal', 'fresh', 'artisanal', 'homemade',
  'farm-to-table', 'sustainable', 'heirloom', 'pesticide-free'
];

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  visible,
  onClose,
  onUploadComplete,
  photoUri,
  marketId,
}) => {
  const [caption, setCaption] = useState('');
  // Category field removed
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags(prev => [...prev, customTag.trim()]);
      setCustomTag('');
    }
  };

  const handleUpload = async () => {
    if (!caption.trim()) {
      Alert.alert('Caption Required', 'Please add a caption for your photo.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload photo to storage
      const { photoUrl, thumbnailUrl } = await photoService.uploadPhoto(
        photoUri,
        marketId
      );

      // Clear progress interval
      clearInterval(progressInterval);
      setUploadProgress(95);

      // Save photo metadata
      const photoData = await photoService.savePhotoMetadata({
        market_id: marketId,
        photo_url: photoUrl,
        thumbnail_url: thumbnailUrl,
        caption: caption.trim(),
        tags: selectedTags,
        user_id: 'current-user-id', // TODO: Get from auth context
      });

      setUploadProgress(100);

      // Success feedback
      setTimeout(() => {
        onUploadComplete(photoData);
        onClose();
        resetForm();
      }, 500);

    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert(
        'Upload Failed',
        'Failed to upload photo. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setCaption('');
    setSelectedTags([]);
    setCustomTag('');
  };

  const handleClose = () => {
    if (isUploading) {
      Alert.alert(
        'Upload in Progress',
        'Are you sure you want to cancel the upload?',
        [
          { text: 'Continue Uploading', style: 'cancel' },
          { text: 'Cancel Upload', style: 'destructive', onPress: onClose }
        ]
      );
    } else {
      onClose();
      resetForm();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>Share Photo</Text>
          <TouchableOpacity 
            onPress={handleUpload} 
            style={[styles.shareButton, isUploading && styles.shareButtonDisabled]}
            disabled={isUploading}
          >
            <Text style={[styles.shareButtonText, isUploading && styles.shareButtonTextDisabled]}>
              {isUploading ? 'Uploading...' : 'Share'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Photo Preview */}
          <View style={styles.photoPreview}>
            <Image source={{ uri: photoUri }} style={styles.photo} />
          </View>

          {/* Upload Progress */}
          {isUploading && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>{uploadProgress}% uploaded</Text>
            </View>
          )}

          {/* Caption */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Caption</Text>
            <TextInput
              style={styles.captionInput}
              placeholder="Tell us about your photo..."
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={500}
              editable={!isUploading}
            />
            <Text style={styles.characterCount}>{caption.length}/500</Text>
          </View>

          {/* Category selection removed - simplified photo upload */}

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {SUGGESTED_TAGS.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tag,
                    selectedTags.includes(tag) && styles.tagSelected
                  ]}
                  onPress={() => handleTagToggle(tag)}
                  disabled={isUploading}
                >
                  <Text style={[
                    styles.tagText,
                    selectedTags.includes(tag) && styles.tagTextSelected
                  ]}>
                    #{tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Tag Input */}
            <View style={styles.customTagContainer}>
              <TextInput
                style={styles.customTagInput}
                placeholder="Add custom tag..."
                value={customTag}
                onChangeText={setCustomTag}
                onSubmitEditing={handleAddCustomTag}
                editable={!isUploading}
              />
              <TouchableOpacity 
                onPress={handleAddCustomTag} 
                style={styles.addTagButton}
                disabled={isUploading || !customTag.trim()}
              >
                <Ionicons name="add" size={20} color="#2E8B57" />
              </TouchableOpacity>
            </View>

            {/* Selected Custom Tags */}
            {selectedTags.filter(tag => !SUGGESTED_TAGS.includes(tag)).length > 0 && (
              <View style={styles.customTagsContainer}>
                {selectedTags.filter(tag => !SUGGESTED_TAGS.includes(tag)).map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.customTag}
                    onPress={() => handleTagToggle(tag)}
                    disabled={isUploading}
                  >
                    <Text style={styles.customTagText}>#{tag}</Text>
                    <Ionicons name="close" size={16} color="#fff" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  shareButton: {
    backgroundColor: '#2E8B57',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  shareButtonDisabled: {
    backgroundColor: '#ccc',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  shareButtonTextDisabled: {
    color: '#999',
  },
  content: {
    flex: 1,
  },
  photoPreview: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#f0f7f0',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2E8B57',
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    color: '#2E8B57',
    textAlign: 'center',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    alignItems: 'center',
  },
  categoryCardSelected: {
    borderColor: '#2E8B57',
    backgroundColor: '#2E8B57',
  },
  categoryLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  categoryLabelSelected: {
    color: '#fff',
  },
  categoryDescription: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  categoryDescriptionSelected: {
    color: '#fff',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2E8B57',
  },
  tagSelected: {
    backgroundColor: '#2E8B57',
  },
  tagText: {
    fontSize: 14,
    color: '#2E8B57',
  },
  tagTextSelected: {
    color: '#fff',
  },
  customTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customTagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  addTagButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8f5e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  customTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#2E8B57',
  },
  customTagText: {
    fontSize: 14,
    color: '#fff',
  },
});

export default PhotoUpload;