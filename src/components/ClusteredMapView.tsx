import React, { useMemo, useCallback, useRef, useEffect, useState, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT, Provider } from 'react-native-maps';
import * as Haptics from 'expo-haptics';
import SuperCluster from 'supercluster';
import { Ionicons } from '@expo/vector-icons';
import { Market } from '../types/index';

interface ClusteredMapViewProps {
  mapRef: React.RefObject<MapView | null>;
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  markets: Market[];
  onMarkerPress: (market: Market) => void;
  onRegionChangeComplete: (region: any) => void;
  showsUserLocation?: boolean;
  style?: any;
  // Favorites functionality
  checkIsFavorite: (marketId: string) => boolean;
  toggleFavorite: (marketId: string) => void;
  onClusterPress?: (cluster: any) => void;
  // Debug options
  disableClustering?: boolean;
  // Performance options
  maxMarkersAtZoom?: {
    low: number; // zoom 0-10
    medium: number; // zoom 11-14  
    high: number; // zoom 15+
  };
}

// Platform-specific map provider configuration
const getMapProvider = (): Provider => {
  if (Platform.OS === 'ios') {
    return PROVIDER_DEFAULT; // Use Apple Maps (MapKit) on iOS
  }
  return PROVIDER_GOOGLE; // Use Google Maps on Android
};

// Platform-specific performance configurations
const getPerformanceConfig = () => {
  if (Platform.OS === 'ios') {
    return {
      maxMarkersAtZoom: { low: 0, medium: 100, high: 200 }, // Higher limits for smoother interaction
      debounceTime: 50, // Much faster response for smooth interaction
      animationDuration: 150,
      clusterRadius: { low: 60, medium: 40, high: 20 },
    };
  }
  return {
    maxMarkersAtZoom: { low: 0, medium: 80, high: 150 }, // Increased limits for Android
    debounceTime: 100, // Reduced debounce for better responsiveness
    animationDuration: 200,
    clusterRadius: { low: 80, medium: 50, high: 25 },
  };
};

const ClusteredMapView: React.FC<ClusteredMapViewProps> = ({
  mapRef,
  region,
  markets,
  onMarkerPress,
  onRegionChangeComplete,
  showsUserLocation = true,
  style,
  checkIsFavorite,
  toggleFavorite,
  onClusterPress,
  disableClustering = false,
  maxMarkersAtZoom = getPerformanceConfig().maxMarkersAtZoom,
}) => {
  // Platform-specific configuration
  const performanceConfig = getPerformanceConfig();
  const mapProvider = getMapProvider();
  
  // Debounced region change for performance
  const regionChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRegionRef = useRef(region);
  const [isMapLoading, setIsMapLoading] = useState(false);
  
  // Zoom controls constants
  const MIN_ZOOM = 3;
  const MAX_ZOOM = 18;
  
  // iOS Performance monitoring
  const performanceRef = useRef({
    renderCount: 0,
    lastRenderTime: Date.now(),
    averageRenderTime: 0,
  });

  // Performance monitoring effect for iOS
  useEffect(() => {
    if (Platform.OS === 'ios') {
      const now = Date.now();
      const renderTime = now - performanceRef.current.lastRenderTime;
      performanceRef.current.renderCount++;
      performanceRef.current.averageRenderTime = 
        (performanceRef.current.averageRenderTime * (performanceRef.current.renderCount - 1) + renderTime) / 
        performanceRef.current.renderCount;
      performanceRef.current.lastRenderTime = now;
      
      // Log performance stats every 10 renders for debugging
      if (performanceRef.current.renderCount % 10 === 0) {
        console.log(`📊 [iOS Performance] Renders: ${performanceRef.current.renderCount}, Avg render time: ${performanceRef.current.averageRenderTime.toFixed(2)}ms, Target: <16.67ms (60fps)`);
      }
    }
  });

  // Memory management for iOS - cleanup on unmount
  useEffect(() => {
    return () => {
      if (Platform.OS === 'ios') {
        // Clear any pending timeouts to prevent memory leaks
        if (regionChangeTimeoutRef.current) {
          clearTimeout(regionChangeTimeoutRef.current);
          regionChangeTimeoutRef.current = null;
        }
        console.log(`🧹 [iOS Memory] ClusteredMapView cleanup completed`);
      }
    };
  }, []);
  
  // Calculate zoom level from region
  const getZoomLevel = useCallback((regionData: typeof region) => {
    return Math.max(1, Math.min(20, Math.round(Math.log(360 / regionData.longitudeDelta) / Math.LN2)));
  }, []);
  
  const currentZoom = useMemo(() => getZoomLevel(region), [region, getZoomLevel]);
  
  // Zoom controls state
  const [zoomLevel, setZoomLevel] = useState(currentZoom);

  // Update zoom level when region changes
  useEffect(() => {
    setZoomLevel(currentZoom);
  }, [currentZoom]);

  // Optimized zoom control functions with haptic feedback
  const zoomIn = useCallback(() => {
    if (zoomLevel >= MAX_ZOOM || !mapRef.current) return;
    
    // Platform-specific haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
        // Haptics not available, continue silently
      });
    }
    
    setIsMapLoading(true);
    const newZoom = Math.min(zoomLevel + 1, MAX_ZOOM);
    const newLatitudeDelta = region.latitudeDelta / 2;
    const newLongitudeDelta = region.longitudeDelta / 2;
    
    const newRegion = {
      ...region,
      latitudeDelta: newLatitudeDelta,
      longitudeDelta: newLongitudeDelta,
    };
    
    mapRef.current.animateToRegion(newRegion, performanceConfig.animationDuration);
    setZoomLevel(newZoom);
    
    // Clear loading state after animation
    setTimeout(() => setIsMapLoading(false), performanceConfig.animationDuration + 50);
  }, [zoomLevel, region, mapRef, MAX_ZOOM, performanceConfig]);

  const zoomOut = useCallback(() => {
    if (zoomLevel <= MIN_ZOOM || !mapRef.current) return;
    
    // Platform-specific haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
        // Haptics not available, continue silently
      });
    }
    
    setIsMapLoading(true);
    const newZoom = Math.max(zoomLevel - 1, MIN_ZOOM);
    const newLatitudeDelta = region.latitudeDelta * 2;
    const newLongitudeDelta = region.longitudeDelta * 2;
    
    const newRegion = {
      ...region,
      latitudeDelta: newLatitudeDelta,
      longitudeDelta: newLongitudeDelta,
    };
    
    mapRef.current.animateToRegion(newRegion, performanceConfig.animationDuration);
    setZoomLevel(newZoom);
    
    // Clear loading state after animation
    setTimeout(() => setIsMapLoading(false), performanceConfig.animationDuration + 50);
  }, [zoomLevel, region, mapRef, MIN_ZOOM, performanceConfig]);
  
  // Determine zoom category for marker strategy
  const zoomCategory = useMemo(() => {
    if (currentZoom <= 10) return 'low';
    if (currentZoom <= 14) return 'medium';
    return 'high';
  }, [currentZoom]);
  
  // Filter points within viewport bounds
  const getPointsInBounds = useCallback((points: any[], bounds: any) => {
    if (!bounds) return points;
    
    return points.filter(point => {
      const [lon, lat] = point.geometry.coordinates;
      return lon >= bounds.sw[0] && lon <= bounds.ne[0] &&
             lat >= bounds.sw[1] && lat <= bounds.ne[1];
    });
  }, []);
  
  // Transform markets to the format SuperCluster expects
  const points = useMemo(() => {
    // Reduced logging on iOS for better performance
    if (Platform.OS !== 'ios') {
      console.log(`🎯 [ClusteredMapView] Starting points transformation...`);
      console.log(`📊 [ClusteredMapView] Input markets:`, markets.length);
      console.log(`🔍 [ClusteredMapView] Sample markets:`, markets.slice(0, 3).map(m => ({
        name: m.name,
        lat: m.latitude,
        lon: m.longitude
      })));
    }
    
    const transformedPoints = markets.map((market, index) => {
      // Validate coordinates
      if (!market.latitude || !market.longitude || 
          isNaN(market.latitude) || isNaN(market.longitude) ||
          Math.abs(market.latitude) > 90 || Math.abs(market.longitude) > 180) {
        console.warn(`⚠️ Invalid coordinates for market ${market.name}:`, {
          lat: market.latitude,
          lon: market.longitude,
          index
        });
        return null;
      }
      
      const point = {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [market.longitude, market.latitude],
        },
        properties: {
          cluster: false,
          market,
        },
      };
      
      // Validate the coordinate format for SuperCluster (should be [longitude, latitude])
      if (Platform.OS !== 'ios' && (Math.abs(market.longitude) > 180 || Math.abs(market.latitude) > 90)) {
        console.error(`❌ [ClusteredMapView] Invalid coordinate range for ${market.name}:`, {
          longitude: market.longitude,
          latitude: market.latitude
        });
      }
      
      // Reduce logging on iOS for performance
      if (Platform.OS !== 'ios') {
        console.log(`📍 [ClusteredMapView] Point ${index}: ${market.name} at [lon:${market.longitude}, lat:${market.latitude}]`);
      }
      return point;
    }).filter(point => point !== null);
    
    // Reduced logging on iOS
    if (Platform.OS !== 'ios') {
      console.log(`✅ [ClusteredMapView] Generated ${transformedPoints.length} valid points from ${markets.length} markets`);
    }
    return transformedPoints;
  }, [markets]);

  // Calculate map bounds for clustering
  const mapBounds = useMemo(() => {
    if (!region) return null;
    
    const bounds = {
      sw: [
        region.longitude - region.longitudeDelta / 2,
        region.latitude - region.latitudeDelta / 2,
      ],
      ne: [
        region.longitude + region.longitudeDelta / 2,
        region.latitude + region.latitudeDelta / 2,
      ],
    };
    
    // Reduced logging on iOS for performance
    if (Platform.OS !== 'ios') {
      console.log(`🗺️ [ClusteredMapView] Map bounds calculated:`, {
        region: region,
        bounds: bounds,
        boundingBox: `SW:[${bounds.sw[0]}, ${bounds.sw[1]}] NE:[${bounds.ne[0]}, ${bounds.ne[1]}]`
      });
    }
    
    return bounds;
  }, [region]);


  // Smart marker strategy: Get clusters and points based on zoom level
  const clusteredPoints = useMemo(() => {
    // Reduced logging on iOS for performance
    if (Platform.OS !== 'ios') {
      console.log(`🔄 [ClusteredMapView] Starting smart clustering process...`);
      console.log(`📊 [ClusteredMapView] Input data:`, {
        hasMapBounds: !!mapBounds,
        pointsCount: points.length,
        currentZoom,
        zoomCategory,
        maxMarkers: maxMarkersAtZoom[zoomCategory as keyof typeof maxMarkersAtZoom],
        region: region,
        disableClustering
      });
    }
    
    if (!mapBounds || points.length === 0) {
      console.log(`❌ [ClusteredMapView] No bounds or points, returning empty array`);
      return [];
    }
    
    // Filter points to viewport first for performance
    const pointsInViewport = getPointsInBounds(points, mapBounds);
    if (Platform.OS !== 'ios') {
      console.log(`🗺️ [ClusteredMapView] Points in viewport: ${pointsInViewport.length}/${points.length}`);
    }
    
    // Debug override - return all points as individuals
    if (disableClustering) {
      if (Platform.OS !== 'ios') {
        console.log(`🚨 [ClusteredMapView] Clustering disabled - showing all ${pointsInViewport.length} viewport markets as individuals`);
      }
      return pointsInViewport.slice(0, maxMarkersAtZoom.high);
    }
    
    // UNIFIED CLUSTERING STRATEGY
    const maxMarkers = maxMarkersAtZoom[zoomCategory as keyof typeof maxMarkersAtZoom];
    
    try {
      const { clusterRadius } = performanceConfig;
      const radius = currentZoom <= 10 ? clusterRadius.low : 
                   currentZoom <= 14 ? clusterRadius.medium : 
                   clusterRadius.high;
      
      const cluster = new SuperCluster({
        radius,
        maxZoom: 18,
        minZoom: 0,
        extent: 512,
        nodeSize: Platform.OS === 'ios' ? 32 : 64, // Smaller node size for iOS
        reduce: (accumulated, props) => {
          accumulated.markets = accumulated.markets || [];
          accumulated.markets.push(props.market);
        },
        map: (props) => ({ market: props.market })
      });
      
      cluster.load(pointsInViewport);
      const boundingBox: [number, number, number, number] = [mapBounds.sw[0], mapBounds.sw[1], mapBounds.ne[0], mapBounds.ne[1]];
      const result = cluster.getClusters(boundingBox, currentZoom);
      
      if (Platform.OS !== 'ios') {
        console.log(`🔍 [ClusteredMapView] Unified clustering: zoom ${currentZoom}, radius ${currentZoom <= 10 ? 80 : currentZoom <= 14 ? 50 : 25}, results: ${result.length}`);
      }
      
      return result.slice(0, maxMarkers);
    } catch (error) {
      console.error('🔥 [ClusteredMapView] Unified clustering error:', error);
      return pointsInViewport.slice(0, maxMarkers);
    }
    
  }, [points, mapBounds, region, disableClustering, currentZoom, zoomCategory, maxMarkersAtZoom, getPointsInBounds]);
  
  // Final clustering performance log (reduced on iOS)
  if (Platform.OS !== 'ios') {
    console.log(`✅ [ClusteredMapView] Smart clustering complete:`, {
      inputPoints: points.length,
      outputMarkers: clusteredPoints.length,
      currentZoom,
      zoomCategory,
      maxAllowed: maxMarkersAtZoom[zoomCategory as keyof typeof maxMarkersAtZoom],
      clusters: clusteredPoints.filter((c: any) => c.properties?.cluster).length,
      individuals: clusteredPoints.filter((c: any) => !c.properties?.cluster).length
    });
  }

  // iOS-optimized Custom Market Marker with Heart Button and entrance animation
  const MarkerWithHeart = React.memo(({ market, coordinate }: { market: Market, coordinate: { latitude: number, longitude: number } }) => {
    const isFav = checkIsFavorite(market.id);
    const scale = useRef(new Animated.Value(1)).current;
    const markerScale = useRef(new Animated.Value(0)).current; // For entrance animation
    
    // Animate marker appearance
    useEffect(() => {
      Animated.spring(markerScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
        delay: Math.random() * 200, // Stagger animations
      }).start();
    }, []);
    
    const handleHeartPress = useCallback((e: any) => {
      e.stopPropagation();
      const animationDuration = Platform.OS === 'ios' ? 80 : 120;
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.2, duration: animationDuration, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: animationDuration, useNativeDriver: true })
      ]).start();
      toggleFavorite(market.id);
    }, [scale, toggleFavorite, market.id]);

    const handleMarkerPress = useCallback(() => {
      Animated.sequence([
        Animated.timing(markerScale, { toValue: 1.1, duration: 100, useNativeDriver: true }),
        Animated.timing(markerScale, { toValue: 1, duration: 100, useNativeDriver: true })
      ]).start();
      onMarkerPress(market);
    }, [market, markerScale]);

    return (
      <Marker
        key={`market-${market.id}`}
        coordinate={coordinate}
        onPress={handleMarkerPress}
        // iOS-specific optimizations
        tracksViewChanges={Platform.OS === 'ios' ? false : true}
        stopPropagation={true}
      >
        <Animated.View style={[styles.customMarker, { transform: [{ scale: markerScale }] }]}>
          <View style={styles.markerPin}>
            <Ionicons
              name="storefront"
              size={22}
              color="#fff"
            />
          </View>
          <TouchableOpacity 
            onPress={handleHeartPress}
            style={styles.heartButton}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
          >
            <Animated.View style={{ transform: [{ scale }] }}>
              <Ionicons
                name={isFav ? 'heart' : 'heart-outline'}
                size={14}
                color={isFav ? '#E74C3C' : '#666'}
              />
            </Animated.View>
          </TouchableOpacity>
          <View style={styles.markerTail} />
        </Animated.View>
      </Marker>
    );
  });
  
  // Memoized Cluster Marker with animations
  const ClusterMarker = React.memo(({ item, index }: { item: any, index: number }) => {
    const [longitude, latitude] = item.geometry.coordinates;
    const scale = useRef(new Animated.Value(1)).current;
    
    // Animate cluster appearance
    useEffect(() => {
      scale.setValue(0);
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 150,
        friction: 8,
      }).start();
    }, []);
    
    const handleClusterPress = useCallback(() => {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.2, duration: 150, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true })
      ]).start();
      
      if (onClusterPress) {
        onClusterPress(item);
      }
    }, [item, scale]);
    
    return (
      <Marker
        key={`cluster-${index}`}
        coordinate={{ latitude, longitude }}
        onPress={handleClusterPress}
        // iOS-specific optimizations
        tracksViewChanges={Platform.OS === 'ios' ? false : true}
        stopPropagation={true}
      >
        <Animated.View style={[styles.clusterContainer, { transform: [{ scale }] }]}>
          <View style={[styles.clusterBubble, getClusterSize(item.properties.point_count)]}>
            <Text style={styles.clusterText}>
              {item.properties.point_count >= 100 ? '99+' : item.properties.point_count}
            </Text>
          </View>
        </Animated.View>
      </Marker>
    );
  });
  
  // Dynamic cluster size based on point count
  const getClusterSize = useCallback((pointCount: number) => {
    if (pointCount >= 100) return { width: 60, height: 60, borderRadius: 30 };
    if (pointCount >= 50) return { width: 50, height: 50, borderRadius: 25 };
    if (pointCount >= 10) return { width: 45, height: 45, borderRadius: 22.5 };
    return { width: 40, height: 40, borderRadius: 20 };
  }, []);

  // Optimized marker rendering with memoization
  const renderMarker = useCallback((item: any, index: number) => {
    if (item.properties.cluster) {
      return <ClusterMarker key={`cluster-${index}`} item={item} index={index} />;
    } else {
      const market = item.properties.market;
      const [longitude, latitude] = item.geometry.coordinates;
      return (
        <MarkerWithHeart 
          key={`market-${market.id}`}
          market={market} 
          coordinate={{ latitude, longitude }} 
        />
      );
    }
  }, [ClusterMarker, MarkerWithHeart]);
  
  // Simplified region change handler for better responsiveness
  const handleRegionChangeComplete = useCallback((newRegion: any) => {
    setIsMapLoading(false);
    
    // Clear any existing timeout
    if (regionChangeTimeoutRef.current) {
      clearTimeout(regionChangeTimeoutRef.current);
    }
    
    // Reduced debounce time for more responsive map interaction
    regionChangeTimeoutRef.current = setTimeout(() => {
      lastRegionRef.current = newRegion;
      onRegionChangeComplete(newRegion);
    }, 100); // Much shorter debounce for better responsiveness
  }, [onRegionChangeComplete]);


  // Zoom Controls Component
  const ZoomControls = () => (
    <View style={styles.zoomControls}>
      <TouchableOpacity
        style={[
          styles.zoomButton,
          zoomLevel >= MAX_ZOOM && styles.zoomButtonDisabled
        ]}
        onPress={zoomIn}
        disabled={zoomLevel >= MAX_ZOOM}
        accessibilityRole="button"
        accessibilityLabel="Zoom in"
        accessibilityHint="Increases the map zoom level"
        activeOpacity={0.7}
      >
        <Ionicons 
          name="add" 
          size={24} 
          color={zoomLevel >= MAX_ZOOM ? '#999' : '#333'} 
        />
      </TouchableOpacity>
      
      <View style={styles.zoomButtonSeparator} />
      
      <TouchableOpacity
        style={[
          styles.zoomButton,
          zoomLevel <= MIN_ZOOM && styles.zoomButtonDisabled
        ]}
        onPress={zoomOut}
        disabled={zoomLevel <= MIN_ZOOM}
        accessibilityRole="button"
        accessibilityLabel="Zoom out"
        accessibilityHint="Decreases the map zoom level"
        activeOpacity={0.7}
      >
        <Ionicons 
          name="remove" 
          size={24} 
          color={zoomLevel <= MIN_ZOOM ? '#999' : '#333'} 
        />
      </TouchableOpacity>
    </View>
  );

  // Platform-specific map configuration
  const getMapConfig = () => {
    const baseConfig = {
      ref: mapRef,
      style: style,
      provider: mapProvider,
      region: region,
      // onRegionChangeComplete handled inline below
      showsUserLocation: showsUserLocation,
      showsMyLocationButton: false,
      loadingEnabled: false,
      moveOnMarkerPress: false,
      // CRITICAL: Ensure all interaction props are explicitly enabled
      pitchEnabled: true,
      rotateEnabled: true,
      scrollEnabled: true,
      zoomEnabled: true,
      zoomTapEnabled: true,
      userInteractionEnabled: true, // CRITICAL: Enable user interactions
      zoomControlEnabled: false,
      followsUserLocation: false,
      userLocationCalloutEnabled: false,
      scrollDuringRotateOrZoomEnabled: true,
      // iOS specific gesture optimizations
      minZoomLevel: 1,
      maxZoomLevel: 20,
    };

    if (Platform.OS === 'ios') {
      // Apple Maps (MapKit) optimizations
      return {
        ...baseConfig,
        showsPointsOfInterest: true, // Native POI integration
        showsBuildings: true, // 3D buildings for better context
        showsTraffic: false,
        showsIndoors: false,
        showsCompass: true, // Native compass
        scrollDuringRotateOrZoomEnabled: true,
        cacheEnabled: true,
        mapPadding: { top: 0, right: 0, bottom: 0, left: 0 },
        // Additional iOS-specific props
        minZoomLevel: MIN_ZOOM,
        maxZoomLevel: MAX_ZOOM,
      };
    } else {
      // Google Maps optimizations for Android
      return {
        ...baseConfig,
        showsPointsOfInterest: false, // Reduce clutter on Android
        showsBuildings: false,
        showsTraffic: false,
        showsIndoors: false,
        showsCompass: false,
        toolbarEnabled: false,
        liteMode: false,
        scrollDuringRotateOrZoomEnabled: false,
        cacheEnabled: false,
      };
    }
  };

  const mapConfig = getMapConfig();

  return (
    <View style={styles.mapContainer}>
      {isMapLoading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
      
      <MapView 
        {...mapConfig}
        // Additional props to ensure responsiveness
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {clusteredPoints.map(renderMarker)}
      </MapView>
    
      <ZoomControls />
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  // Zoom Controls Styles - Bottom Right Corner
  zoomControls: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 40, // Better spacing to avoid market list overlap
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
    // iOS-specific enhancements
    ...(Platform.OS === 'ios' && {
      borderWidth: 0.5,
      borderColor: 'rgba(0, 0, 0, 0.1)',
    }),
  },
  zoomButton: {
    width: 44, // iOS minimum touch target
    height: 44, // iOS minimum touch target
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    // Add subtle press feedback
    borderRadius: 0,
  },
  zoomButtonDisabled: {
    opacity: 0.4,
  },
  zoomButtonSeparator: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 8,
  },
  clusterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterBubble: {
    backgroundColor: '#2E8B57',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  clusterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Custom marker styles
  customMarker: {
    alignItems: 'center',
    position: 'relative',
  },
  markerPin: {
    backgroundColor: '#2E8B57',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#fff',
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#2E8B57',
    marginTop: -1,
  },
  heartButton: {
    position: 'absolute',
    top: -2,
    right: -2,
    padding: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  
  // Loading overlay styles
  loadingOverlay: {
    position: 'absolute',
    top: 10,
    left: '50%',
    transform: [{ translateX: -30 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 1000,
  },
  
  loadingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default memo(ClusteredMapView);