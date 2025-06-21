import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FilterOption {
  id: string;
  name: string;
  filter: string;
}

const ShareScreen: React.FC = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState(CameraType.back);
  const [isRecording, setIsRecording] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('none');
  const [showCamera, setShowCamera] = useState(true);
  
  const cameraRef = useRef<Camera>(null);

  const filterOptions: FilterOption[] = [
    { id: 'none', name: 'Original', filter: 'none' },
    { id: 'vibrant', name: 'Vibrant', filter: 'saturate(1.3) contrast(1.1)' },
    { id: 'warm', name: 'Warm', filter: 'sepia(0.3) saturate(1.2)' },
    { id: 'cool', name: 'Cool', filter: 'hue-rotate(15deg) saturate(0.9)' },
    { id: 'vintage', name: 'Vintage', filter: 'sepia(0.5) contrast(0.9)' },
  ];

  useEffect(() => {
    getCameraPermissions();
  }, []);

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        setCapturedImage(photo.uri);
        setShowCamera(false);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const pickImage = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
        setShowCamera(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const toggleCameraType = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCameraType(
      cameraType === CameraType.back ? CameraType.front : CameraType.back
    );
  };

  const retakePhoto = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCapturedImage(null);
    setShowCamera(true);
    setSelectedFilter('none');
  };

  const sharePhoto = async () => {
    if (!capturedImage) return;
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // This would integrate with your sharing logic
    Alert.alert(
      'Share Photo',
      'Photo will be shared to your market community!',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Share', 
          onPress: () => {
            // Implement sharing logic here
            console.log('Sharing photo:', capturedImage);
            setCapturedImage(null);
            setShowCamera(true);
            setSelectedFilter('none');
          }
        }
      ]
    );
  };

  const renderCameraView = () => {
    if (hasPermission === null) {
      return (
        <View style={styles.centered}>
          <Text style={styles.message}>Requesting camera permission...</Text>
        </View>
      );
    }

    if (hasPermission === false) {
      return (
        <View style={styles.centered}>
          <Ionicons name="camera-outline" size={64} color="#999" />
          <Text style={styles.message}>No access to camera</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={getCameraPermissions}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={cameraType}
          ratio="4:3"
        >
          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.controlButton} onPress={toggleCameraType}>
              <Ionicons name="camera-reverse" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
              <Ionicons name="images" size={24} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.captureButton, isRecording && styles.captureButtonActive]}
              onPress={takePicture}
              disabled={isRecording}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            
            <View style={styles.placeholder} />
          </View>
        </Camera>
      </View>
    );
  };

  const renderFilterOptions = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filtersContainer}
    >
      {filterOptions.map((filter) => (
        <TouchableOpacity
          key={filter.id}
          style={[
            styles.filterButton,
            selectedFilter === filter.id && styles.filterButtonActive
          ]}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedFilter(filter.id);
          }}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedFilter === filter.id && styles.filterButtonTextActive
            ]}
          >
            {filter.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderPreviewView = () => (
    <View style={styles.previewContainer}>
      {/* Preview Image */}
      <View style={styles.previewImageContainer}>
        <Image
          source={{ uri: capturedImage! }}
          style={styles.previewImage}
          resizeMode="cover"
        />
      </View>

      {/* Filter Options */}
      {renderFilterOptions()}

      {/* Action Buttons */}
      <View style={styles.previewActions}>
        <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
          <Ionicons name="camera" size={24} color="#666" />
          <Text style={styles.retakeButtonText}>Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareButton} onPress={sharePhoto}>
          <LinearGradient
            colors={['#2E8B57', '#90EE90']}
            style={styles.shareButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="share" size={24} color="#fff" />
            <Text style={styles.shareButtonText}>Share to Community</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Tagging Options */}
      <View style={styles.taggingSection}>
        <Text style={styles.taggingTitle}>Tag Your Experience</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsContainer}
        >
          {['Fresh Produce', 'Great Vendor', 'Market Day', 'Organic', 'Local Favorite'].map((tag) => (
            <TouchableOpacity key={tag} style={styles.tagButton}>
              <Text style={styles.tagButtonText}>#{tag}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📸 Share</Text>
        <Text style={styles.headerSubtitle}>Capture & share your market experience</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {showCamera && !capturedImage ? renderCameraView() : renderPreviewView()}
      </View>

      {/* Tips Section */}
      {showCamera && (
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Pro Tips</Text>
          <Text style={styles.tipsText}>
            • Capture colorful produce and vibrant market scenes{'\n'}
            • Tag vendors to give them credit{'\n'}
            • Share your favorite finds with the community
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  permissionButton: {
    backgroundColor: '#2E8B57',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Header Styles
  header: {
    padding: 16,
    backgroundColor: '#000',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
  },

  // Camera Styles
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  captureButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  placeholder: {
    width: 50,
    height: 50,
  },

  // Preview Styles
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewImageContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  shareButton: {
    flex: 1,
    marginLeft: 16,
    borderRadius: 24,
    overflow: 'hidden',
  },
  shareButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Filter Styles
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#2E8B57',
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // Tagging Styles
  taggingSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  taggingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tagsContainer: {
    paddingRight: 16,
  },
  tagButton: {
    backgroundColor: 'rgba(46, 139, 87, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(46, 139, 87, 0.3)',
  },
  tagButtonText: {
    color: '#90EE90',
    fontSize: 12,
    fontWeight: '500',
  },

  // Tips Styles
  tipsSection: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tipsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipsText: {
    color: '#999',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default ShareScreen;