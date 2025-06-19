import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
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
}

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
) => {
  // Transform markets to the format SuperCluster expects
  const points = useMemo(() => {
    console.log(`🎯 [ClusteredMapView] Starting points transformation...`);
    console.log(`📊 [ClusteredMapView] Input markets:`, markets.length);
    console.log(`🔍 [ClusteredMapView] Sample markets:`, markets.slice(0, 3).map(m => ({
      name: m.name,
      lat: m.latitude,
      lon: m.longitude
    })));
    
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
      if (Math.abs(market.longitude) > 180 || Math.abs(market.latitude) > 90) {
        console.error(`❌ [ClusteredMapView] Invalid coordinate range for ${market.name}:`, {
          longitude: market.longitude,
          latitude: market.latitude
        });
      }
      
      console.log(`📍 [ClusteredMapView] Point ${index}: ${market.name} at [lon:${market.longitude}, lat:${market.latitude}]`);
      return point;
    }).filter(point => point !== null);
    
    console.log(`✅ [ClusteredMapView] Generated ${transformedPoints.length} valid points from ${markets.length} markets`);
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
    
    console.log(`🗺️ [ClusteredMapView] Map bounds calculated:`, {
      region: region,
      bounds: bounds,
      boundingBox: `SW:[${bounds.sw[0]}, ${bounds.sw[1]}] NE:[${bounds.ne[0]}, ${bounds.ne[1]}]`
    });
    
    return bounds;
  }, [region]);

  // Get clusters and points
  const clusteredPoints = useMemo(() => {
    console.log(`🔄 [ClusteredMapView] Starting clustering process...`);
    console.log(`📊 [ClusteredMapView] Input data:`, {
      hasMapBounds: !!mapBounds,
      pointsCount: points.length,
      region: region,
      disableClustering
    });
    
    if (!mapBounds || points.length === 0) {
      console.log(`❌ [ClusteredMapView] No bounds or points, returning empty array`);
      return [];
    }
    
    // Debug override - return all points as individuals
    if (disableClustering) {
      console.log(`🚨 [ClusteredMapView] Clustering disabled - showing all ${points.length} markets as individuals`);
      return points;
    }
    
    try {
      const clusterConfig = {
        radius: 40, // Decreased from 60 to allow individual markers to show up more easily
        maxZoom: 20, // Increased from 16 to allow more individual markers at high zoom
        minZoom: 1,
        extent: 512,
        nodeSize: 64,
      };
      
      console.log(`⚙️ [ClusteredMapView] SuperCluster config:`, clusterConfig);
      
      const cluster = new SuperCluster(clusterConfig);
      cluster.load(points);
      
      const zoom = Math.max(1, Math.min(20, Math.round(Math.log(360 / region.longitudeDelta) / Math.LN2)));
      
      console.log(`🔍 [ClusteredMapView] Calculated zoom level: ${zoom} (longitudeDelta: ${region.longitudeDelta})`);
      
      const boundingBox = [mapBounds.sw[0], mapBounds.sw[1], mapBounds.ne[0], mapBounds.ne[1]];
      console.log(`📦 [ClusteredMapView] Bounding box for clustering:`, boundingBox);
      
      const clusteredResult = cluster.getClusters(boundingBox, zoom);
      
      // Failsafe: If zoomed in very close (longitudeDelta < 0.01) and no individual markers are showing,
      // bypass clustering and show all points within the bounds as individual markers
      const isVeryZoomedIn = region.longitudeDelta < 0.01;
      const hasIndividualMarkers = clusteredResult.some(c => !c.properties.cluster);
      
      console.log(`🔍 [ClusteredMapView] Zoom analysis:`, {
        longitudeDelta: region.longitudeDelta,
        isVeryZoomedIn,
        hasIndividualMarkers,
        zoom
      });
      
      if (isVeryZoomedIn && !hasIndividualMarkers && points.length > 0) {
        console.log(`🚨 [ClusteredMapView] Failsafe activated: Very zoomed in but no individual markers. Showing all points as individuals.`);
        
        // Filter points that are within the current map bounds
        const pointsInBounds = points.filter(point => {
          const [lon, lat] = point.geometry.coordinates;
          return lon >= boundingBox[0] && lon <= boundingBox[2] &&
                 lat >= boundingBox[1] && lat <= boundingBox[3];
        });
        
        console.log(`📍 [ClusteredMapView] Failsafe: Showing ${pointsInBounds.length} individual points within bounds`);
        return pointsInBounds;
      }
      
      console.log(`✅ [ClusteredMapView] Clustering complete:`, {
        inputPoints: points.length,
        outputClusters: clusteredResult.length,
        zoom: zoom,
        clusters: clusteredResult.filter(c => c.properties.cluster).length,
        individuals: clusteredResult.filter(c => !c.properties.cluster).length
      });
      
      // Log each result for debugging
      clusteredResult.forEach((item, index) => {
        if (item.properties.cluster) {
          console.log(`🏢 [ClusteredMapView] Cluster ${index}: ${item.properties.point_count} points at [${item.geometry.coordinates[0]}, ${item.geometry.coordinates[1]}]`);
        } else {
          const market = item.properties.market;
          console.log(`📍 [ClusteredMapView] Individual ${index}: ${market?.name || 'Unknown'} at [${item.geometry.coordinates[0]}, ${item.geometry.coordinates[1]}]`);
        }
      });
      
      return clusteredResult;
    } catch (error) {
      console.error('🔥 [ClusteredMapView] Clustering error:', error);
      console.log('🔄 [ClusteredMapView] Fallback: returning individual points');
      // Return individual points if clustering fails
      return points;
    }
  }, [points, mapBounds, region, disableClustering]);

  // Custom Market Marker with Heart Button
  const MarkerWithHeart = ({ market, coordinate }: { market: Market, coordinate: { latitude: number, longitude: number } }) => {
    const isFav = checkIsFavorite(market.id);
    const scale = new Animated.Value(1);
    
    const handleHeartPress = (e: any) => {
      e.stopPropagation();
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.3, duration: 120, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true })
      ]).start();
      toggleFavorite(market.id);
    };

    return (
      <Marker
        key={`market-${market.id}`}
        coordinate={coordinate}
        onPress={() => onMarkerPress(market)}
      >
        <View style={styles.customMarker}>
          <View style={styles.markerPin}>
            <TouchableOpacity 
              onPress={handleHeartPress}
              style={styles.heartButton}
              hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            >
              <Animated.View style={{ transform: [{ scale }] }}>
                <Ionicons
                  name={isFav ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isFav ? '#E74C3C' : '#666'}
                />
              </Animated.View>
            </TouchableOpacity>
          </View>
          <View style={styles.markerTail} />
        </View>
      </Marker>
    );
  };

  const renderMarker = (item: any, index: number) => {
    const [longitude, latitude] = item.geometry.coordinates;
    
    console.log(`🎨 [ClusteredMapView] Rendering marker ${index}:`, {
      isCluster: item.properties.cluster,
      coordinates: [longitude, latitude],
      pointCount: item.properties.point_count,
      marketName: item.properties.market?.name
    });
    
    if (item.properties.cluster) {
      // Render cluster
      console.log(`🏢 [ClusteredMapView] Rendering cluster with ${item.properties.point_count} points at [${longitude}, ${latitude}]`);
      return (
        <Marker
          key={`cluster-${index}`}
          coordinate={{ latitude, longitude }}
          onPress={() => onClusterPress && onClusterPress(item)}
        >
          <View style={styles.clusterContainer}>
            <View style={styles.clusterBubble}>
              <Text style={styles.clusterText}>
                {item.properties.point_count}
              </Text>
            </View>
          </View>
        </Marker>
      );
    } else {
      // Render individual market with heart button
      const market = item.properties.market;
      console.log(`📍 [ClusteredMapView] Rendering individual market: ${market?.name || 'Unknown'} at [${longitude}, ${latitude}]`);
      return (
        <MarkerWithHeart 
          key={`market-${market.id}`}
          market={market} 
          coordinate={{ latitude, longitude }} 
        />
      );
    }
  };

  return (
    <MapView
      ref={mapRef}
      style={style}
      provider={PROVIDER_GOOGLE}
      region={region}
      onRegionChangeComplete={onRegionChangeComplete}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={false}
    >
      {clusteredPoints.map(renderMarker)}
    </MapView>
  );
};

const styles = StyleSheet.create({
  clusterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterBubble: {
    backgroundColor: '#2E8B57',
    borderRadius: 20,
    borderWidth: 2,
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
  clusterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Custom marker styles
  customMarker: {
    alignItems: 'center',
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
    padding: 2,
  },
});

export default ClusteredMapView;