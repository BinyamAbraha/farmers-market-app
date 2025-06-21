import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../hooks/useFavorites';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: 'toggle' | 'navigation' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

const ProfileScreen: React.FC = () => {
  const { favoriteMarkets } = useFavorites();
  const [notifications, setNotifications] = useState({
    marketOpening: true,
    seasonalProduce: true,
    newMarkets: false,
  });

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => {
          Alert.alert('Success', 'You have been logged out.');
        }}
      ]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      'Help & Support',
      'Contact us at support@farmersmarketapp.com or visit our FAQ section.',
      [{ text: 'OK' }]
    );
  };

  const handleRatings = () => {
    Alert.alert(
      'Rating History',
      'You have rated 3 markets with an average of 4.7 stars.',
      [{ text: 'OK' }]
    );
  };

  const handleLocationPreferences = () => {
    Alert.alert(
      'Location Preferences',
      'Manage your default search radius and preferred regions.',
      [{ text: 'OK' }]
    );
  };

  const handleAccountManagement = () => {
    Alert.alert(
      'Account Management',
      'Update your profile information, change password, or delete account.',
      [{ text: 'OK' }]
    );
  };

  const userStats = {
    photosShared: 12,
    reviewsWritten: 3,
    favoriteMarkets: favoriteMarkets.length,
    marketsVisited: 8,
  };

  const notificationSettings: SettingItem[] = [
    {
      id: 'market-opening',
      title: 'Market Opening Alerts',
      subtitle: 'Get notified when your favorite markets open',
      icon: 'notifications',
      type: 'toggle',
      value: notifications.marketOpening,
      onToggle: () => handleNotificationToggle('marketOpening'),
    },
    {
      id: 'seasonal-produce',
      title: 'Seasonal Produce Alerts',
      subtitle: 'Learn when produce comes into season',
      icon: 'leaf',
      type: 'toggle',
      value: notifications.seasonalProduce,
      onToggle: () => handleNotificationToggle('seasonalProduce'),
    },
    {
      id: 'new-markets',
      title: 'New Markets Nearby',
      subtitle: 'Discover new markets in your area',
      icon: 'location',
      type: 'toggle',
      value: notifications.newMarkets,
      onToggle: () => handleNotificationToggle('newMarkets'),
    },
  ];

  const settingsItems: SettingItem[] = [
    {
      id: 'location-preferences',
      title: 'Location Preferences',
      subtitle: 'Search radius and preferred regions',
      icon: 'map',
      type: 'navigation',
      onPress: handleLocationPreferences,
    },
    {
      id: 'rating-history',
      title: 'Rating & Review History',
      subtitle: 'View your market ratings and reviews',
      icon: 'star',
      type: 'navigation',
      onPress: handleRatings,
    },
    {
      id: 'help-support',
      title: 'Help & Support',
      subtitle: 'FAQ, contact us, and app feedback',
      icon: 'help-circle',
      type: 'navigation',
      onPress: handleHelp,
    },
    {
      id: 'account-management',
      title: 'Account Management',
      subtitle: 'Profile, password, and account settings',
      icon: 'person-circle',
      type: 'navigation',
      onPress: handleAccountManagement,
    },
    {
      id: 'logout',
      title: 'Logout',
      subtitle: 'Sign out of your account',
      icon: 'log-out',
      type: 'action',
      onPress: handleLogout,
    },
  ];

  const renderUserProfile = () => (
    <View style={styles.profileSection}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#2E8B57" />
        </View>
      </View>
      <Text style={styles.userName}>Market Explorer</Text>
      <Text style={styles.userEmail}>user@farmersmarket.app</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userStats.photosShared}</Text>
          <Text style={styles.statLabel}>Photos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userStats.reviewsWritten}</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userStats.favoriteMarkets}</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userStats.marketsVisited}</Text>
          <Text style={styles.statLabel}>Visited</Text>
        </View>
      </View>
    </View>
  );

  const renderSection = (title: string, items: SettingItem[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.settingItem}
          onPress={item.onPress}
          disabled={item.type === 'toggle'}
        >
          <View style={styles.settingIcon}>
            <Ionicons name={item.icon} size={20} color="#2E8B57" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>{item.title}</Text>
            {item.subtitle && (
              <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
            )}
          </View>
          <View style={styles.settingAction}>
            {item.type === 'toggle' && item.onToggle && (
              <Switch
                value={item.value}
                onValueChange={item.onToggle}
                trackColor={{ false: '#f0f0f0', true: '#2E8B57' }}
                thumbColor={item.value ? '#fff' : '#999'}
              />
            )}
            {item.type === 'navigation' && (
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            )}
            {item.type === 'action' && item.id === 'logout' && (
              <Ionicons name="log-out" size={20} color="#E74C3C" />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderAppInfo = () => (
    <View style={styles.appInfoSection}>
      <Text style={styles.appInfoTitle}>Farmers Market App</Text>
      <Text style={styles.appInfoVersion}>Version 1.0.0</Text>
      <Text style={styles.appInfoBuild}>Build 2024.1</Text>
      <Text style={styles.appInfoCopyright}>
        © 2024 Farmers Market App. All rights reserved.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderUserProfile()}
        {renderSection('🔔 Alerts & Notifications', notificationSettings)}
        {renderSection('⚙️ Settings', settingsItems)}
        {renderAppInfo()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f5e8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#2E8B57',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E8B57',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f5e8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  settingAction: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  appInfoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  appInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E8B57',
    marginBottom: 8,
  },
  appInfoVersion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  appInfoBuild: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  appInfoCopyright: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ProfileScreen;