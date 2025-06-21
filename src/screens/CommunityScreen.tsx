import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

interface CommunityPost {
  id: string;
  user: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  content: {
    image: string;
    caption: string;
    tags: string[];
  };
  market: {
    name: string;
    location: string;
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  timestamp: string;
  liked: boolean;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  image: string;
  participantCount: number;
  endDate: string;
  prize: string;
}

const CommunityScreen: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'challenges' | 'leaderboard'>('feed');

  // Sample community posts
  const communityPosts: CommunityPost[] = [
    {
      id: '1',
      user: {
        name: 'Sarah Chen',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b789?w=100&h=100&fit=crop&crop=face',
        verified: true,
      },
      content: {
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop',
        caption: 'Amazing strawberries at Sunnyvale Farmers Market! Peak season is here 🍓',
        tags: ['strawberries', 'seasonal', 'fresh'],
      },
      market: {
        name: 'Sunnyvale Farmers Market',
        location: 'Sunnyvale, CA',
      },
      stats: {
        likes: 24,
        comments: 8,
        shares: 3,
      },
      timestamp: '2 hours ago',
      liked: false,
    },
    {
      id: '2',
      user: {
        name: 'Mike Johnson',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        verified: false,
      },
      content: {
        image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&h=300&fit=crop',
        caption: 'Green Valley Farm has the best organic vegetables! Their tomatoes are incredible.',
        tags: ['organic', 'vegetables', 'tomatoes'],
      },
      market: {
        name: 'Downtown Farmers Market',
        location: 'San Francisco, CA',
      },
      stats: {
        likes: 31,
        comments: 12,
        shares: 5,
      },
      timestamp: '4 hours ago',
      liked: true,
    },
  ];

  // Sample challenges
  const challenges: Challenge[] = [
    {
      id: '1',
      title: 'Summer Produce Challenge',
      description: 'Share photos of your colorful summer produce hauls',
      image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=300&h=200&fit=crop',
      participantCount: 127,
      endDate: 'July 31',
      prize: '$100 market gift card',
    },
    {
      id: '2',
      title: 'Meet the Farmer',
      description: 'Take a photo with your favorite vendor',
      image: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=300&h=200&fit=crop',
      participantCount: 89,
      endDate: 'August 15',
      prize: 'Featured in market newsletter',
    },
  ];

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Simulate loading new content
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  }, []);

  const handleLike = async (postId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Implement like functionality
    console.log('Liked post:', postId);
  };

  const handleComment = async (postId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to comments
    console.log('Comment on post:', postId);
  };

  const handleShare = async (postId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Implement share functionality
    console.log('Share post:', postId);
  };

  const handleTabPress = async (tab: 'feed' | 'challenges' | 'leaderboard') => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  // Header Component
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>💬 Community</Text>
      <Text style={styles.headerSubtitle}>Connect with local market lovers</Text>
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="search" size={24} color="#2E8B57" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="notifications-outline" size={24} color="#2E8B57" />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Tab Navigation
  const renderTabNavigation = () => (
    <View style={styles.tabNavigation}>
      {[
        { key: 'feed', label: 'Feed', icon: 'home' },
        { key: 'challenges', label: 'Challenges', icon: 'trophy' },
        { key: 'leaderboard', label: 'Leaders', icon: 'podium' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tabButton,
            activeTab === tab.key && styles.tabButtonActive
          ]}
          onPress={() => handleTabPress(tab.key as any)}
        >
          <Ionicons
            name={tab.icon as any}
            size={20}
            color={activeTab === tab.key ? '#2E8B57' : '#999'}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === tab.key && styles.tabButtonTextActive
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Post Component
  const renderPost = ({ item }: { item: CommunityPost }) => (
    <View style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <Image source={{ uri: item.user.avatar }} style={styles.userAvatar} />
        <View style={styles.userInfo}>
          <View style={styles.userNameContainer}>
            <Text style={styles.userName}>{item.user.name}</Text>
            {item.user.verified && (
              <Ionicons name="checkmark-circle" size={16} color="#2E8B57" />
            )}
          </View>
          <Text style={styles.marketInfo}>
            📍 {item.market.name} • {item.timestamp}
          </Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Post Image */}
      <Image source={{ uri: item.content.image }} style={styles.postImage} />

      {/* Post Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLike(item.id)}
        >
          <Ionicons
            name={item.liked ? 'heart' : 'heart-outline'}
            size={24}
            color={item.liked ? '#FF6B6B' : '#666'}
          />
          <Text style={styles.actionText}>{item.stats.likes}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleComment(item.id)}
        >
          <Ionicons name="chatbubble-outline" size={22} color="#666" />
          <Text style={styles.actionText}>{item.stats.comments}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleShare(item.id)}
        >
          <Ionicons name="share-outline" size={22} color="#666" />
          <Text style={styles.actionText}>{item.stats.shares}</Text>
        </TouchableOpacity>
      </View>

      {/* Post Caption */}
      <View style={styles.postContent}>
        <Text style={styles.postCaption}>{item.content.caption}</Text>
        <View style={styles.postTags}>
          {item.content.tags.map((tag) => (
            <TouchableOpacity key={tag} style={styles.tagChip}>
              <Text style={styles.tagText}>#{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  // Challenge Component
  const renderChallenge = ({ item }: { item: Challenge }) => (
    <View style={styles.challengeCard}>
      <Image source={{ uri: item.image }} style={styles.challengeImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.challengeGradient}
      />
      <View style={styles.challengeContent}>
        <Text style={styles.challengeTitle}>{item.title}</Text>
        <Text style={styles.challengeDescription}>{item.description}</Text>
        <View style={styles.challengeStats}>
          <Text style={styles.challengeStatsText}>
            🏆 {item.prize} • 👥 {item.participantCount} participants
          </Text>
          <Text style={styles.challengeEndDate}>Ends {item.endDate}</Text>
        </View>
        <TouchableOpacity style={styles.joinButton}>
          <LinearGradient
            colors={['#2E8B57', '#90EE90']}
            style={styles.joinButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.joinButtonText}>Join Challenge</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Feed Content
  const renderFeedContent = () => (
    <FlatList
      data={communityPosts}
      renderItem={renderPost}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.feedContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={['#2E8B57']}
          tintColor="#2E8B57"
        />
      }
    />
  );

  // Challenges Content
  const renderChallengesContent = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.challengesContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={['#2E8B57']}
          tintColor="#2E8B57"
        />
      }
    >
      {challenges.map((challenge) => (
        <View key={challenge.id} style={styles.challengeCardWrapper}>
          {renderChallenge({ item: challenge })}
        </View>
      ))}
    </ScrollView>
  );

  // Leaderboard Content
  const renderLeaderboardContent = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.leaderboardContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={['#2E8B57']}
          tintColor="#2E8B57"
        />
      }
    >
      <View style={styles.comingSoon}>
        <Ionicons name="trophy-outline" size={64} color="#999" />
        <Text style={styles.comingSoonTitle}>Leaderboard Coming Soon!</Text>
        <Text style={styles.comingSoonText}>
          See who's the most active in your local market community
        </Text>
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return renderFeedContent();
      case 'challenges':
        return renderChallengesContent();
      case 'leaderboard':
        return renderLeaderboardContent();
      default:
        return renderFeedContent();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderTabNavigation()}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },

  // Tab Navigation
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  tabButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
    marginLeft: 6,
  },
  tabButtonTextActive: {
    color: '#2E8B57',
    fontWeight: '600',
  },

  // Feed Styles
  feedContainer: {
    padding: 16,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 4,
  },
  marketInfo: {
    fontSize: 12,
    color: '#666',
  },
  moreButton: {
    padding: 4,
  },
  postImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  postContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  postCaption: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  postTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagChip: {
    backgroundColor: '#f0f8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#2E8B57',
    fontWeight: '500',
  },

  // Challenge Styles
  challengesContainer: {
    padding: 16,
  },
  challengeCardWrapper: {
    marginBottom: 16,
  },
  challengeCard: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  challengeImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  challengeGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  challengeContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  challengeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },
  challengeStats: {
    marginBottom: 12,
  },
  challengeStatsText: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 2,
  },
  challengeEndDate: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  joinButton: {
    borderRadius: 20,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  joinButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Leaderboard Styles
  leaderboardContainer: {
    flex: 1,
    padding: 16,
  },
  comingSoon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default CommunityScreen;