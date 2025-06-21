import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

interface TabConfig {
  name: string;
  activeIcon: string;
  inactiveIcon: string;
  label: string;
  color: string;
  badge?: number;
}

const tabConfigs: Record<string, TabConfig> = {
  Discover: {
    name: 'Discover',
    activeIcon: 'home',
    inactiveIcon: 'home-outline',
    label: 'Discover',
    color: '#2E8B57',
  },
  Map: {
    name: 'Map',
    activeIcon: 'map',
    inactiveIcon: 'map-outline',
    label: 'Map',
    color: '#4ECDC4',
  },
  Share: {
    name: 'Share',
    activeIcon: 'add-circle',
    inactiveIcon: 'add-circle-outline',
    label: 'Share',
    color: '#FF6B6B',
  },
  Community: {
    name: 'Community',
    activeIcon: 'people',
    inactiveIcon: 'people-outline',
    label: 'Community',
    color: '#FFA500',
    badge: 3,
  },
  Profile: {
    name: 'Profile',
    activeIcon: 'person',
    inactiveIcon: 'person-outline',
    label: 'Profile',
    color: '#9B59B6',
  },
};

const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const tabWidth = screenWidth / state.routes.length;

  const handleTabPress = async (route: any, index: number, isFocused: boolean) => {
    // Haptic feedback
    if (route.name === 'Share') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  const renderTab = (route: any, index: number) => {
    const { options } = descriptors[route.key];
    const isFocused = state.index === index;
    const config = tabConfigs[route.name];

    if (!config) return null;

    const isShareTab = route.name === 'Share';

    // Special styling for Share tab
    if (isShareTab) {
      return (
        <TouchableOpacity
          key={route.key}
          style={styles.shareTabContainer}
          onPress={() => handleTabPress(route, index, isFocused)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FF6B6B', '#FF8E8E']}
            style={styles.shareTabButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons
              name={isFocused ? config.activeIcon as any : config.inactiveIcon as any}
              size={28}
              color="#fff"
            />
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={route.key}
        style={styles.tabContainer}
        onPress={() => handleTabPress(route, index, isFocused)}
        activeOpacity={0.8}
      >
        <View style={styles.tabContent}>
          {/* Tab Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name={isFocused ? config.activeIcon as any : config.inactiveIcon as any}
              size={24}
              color={isFocused ? config.color : '#999'}
              style={[
                styles.tabIcon,
                isFocused && { transform: [{ scale: 1.1 }] }
              ]}
            />
            
            {/* Badge */}
            {config.badge && config.badge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {config.badge > 99 ? '99+' : config.badge}
                </Text>
              </View>
            )}

            {/* Active Indicator */}
            {isFocused && (
              <View style={[styles.activeIndicator, { backgroundColor: config.color }]} />
            )}
          </View>

          {/* Tab Label */}
          <Text
            style={[
              styles.tabLabel,
              {
                color: isFocused ? config.color : '#999',
                fontWeight: isFocused ? '600' : '500',
              }
            ]}
          >
            {config.label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background Blur Effect */}
      <LinearGradient
        colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.98)']}
        style={[
          styles.tabBar,
          {
            paddingBottom: Math.max(insets.bottom, 20),
            height: 80 + Math.max(insets.bottom, 20),
          }
        ]}
      >
        {/* Top Border */}
        <View style={styles.topBorder} />
        
        {/* Tab Content */}
        <View style={styles.tabsContainer}>
          {state.routes.map((route, index) => renderTab(route, index))}
        </View>
      </LinearGradient>

      {/* Shadow */}
      <View style={styles.shadow} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  shadow: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  tabBar: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 3,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  tabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minHeight: 44, // Accessibility minimum touch target
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tabIcon: {
    // Icon styles are handled in the component
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  tabLabel: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },

  // Share Tab Styles
  shareTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  shareTabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#fff',
  },
});

export default CustomTabBar;