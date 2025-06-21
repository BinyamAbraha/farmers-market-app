import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../hooks/useFavorites';

interface ShoppingList {
  id: string;
  name: string;
  itemCount: number;
  lastModified: string;
  items: string[];
}

interface SeasonalProduce {
  name: string;
  icon: string;
  season: 'current' | 'coming-soon';
  months: string[];
}

const SAMPLE_SHOPPING_LISTS: ShoppingList[] = [
  {
    id: '1',
    name: 'Weekend Market Run',
    itemCount: 8,
    lastModified: '2 hours ago',
    items: ['Tomatoes', 'Lettuce', 'Carrots', 'Apples', 'Bread', 'Honey', 'Eggs', 'Cheese'],
  },
  {
    id: '2',
    name: 'Thanksgiving Prep',
    itemCount: 12,
    lastModified: '1 day ago',
    items: ['Pumpkins', 'Sweet Potatoes', 'Brussels Sprouts', 'Cranberries'],
  },
];

const SEASONAL_PRODUCE: SeasonalProduce[] = [
  { name: 'Apples', icon: '🍎', season: 'current', months: ['Oct', 'Nov', 'Dec'] },
  { name: 'Pumpkins', icon: '🎃', season: 'current', months: ['Oct', 'Nov'] },
  { name: 'Brussels Sprouts', icon: '🥬', season: 'current', months: ['Oct', 'Nov', 'Dec'] },
  { name: 'Sweet Potatoes', icon: '🍠', season: 'current', months: ['Oct', 'Nov', 'Dec'] },
  { name: 'Strawberries', icon: '🍓', season: 'coming-soon', months: ['May', 'Jun', 'Jul'] },
  { name: 'Tomatoes', icon: '🍅', season: 'coming-soon', months: ['Jun', 'Jul', 'Aug'] },
];

const ListsScreen: React.FC = () => {
  const [shoppingLists] = useState<ShoppingList[]>(SAMPLE_SHOPPING_LISTS);
  const [seasonalAlerts, setSeasonalAlerts] = useState(true);
  const { favoriteMarkets } = useFavorites();

  const handleCreateNewList = () => {
    Alert.alert(
      'Create Shopping List',
      'This feature will allow you to create custom shopping lists with vendor recommendations.',
      [{ text: 'OK' }]
    );
  };

  const handleListPress = (list: ShoppingList) => {
    Alert.alert(
      list.name,
      `Items: ${list.items.join(', ')}`,
      [{ text: 'OK' }]
    );
  };

  const renderShoppingListsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📝 Shopping Lists</Text>
        <TouchableOpacity onPress={handleCreateNewList} style={styles.addButton}>
          <Ionicons name="add" size={20} color="#2E8B57" />
          <Text style={styles.addButtonText}>New List</Text>
        </TouchableOpacity>
      </View>
      
      {shoppingLists.map((list) => (
        <TouchableOpacity
          key={list.id}
          style={styles.listCard}
          onPress={() => handleListPress(list)}
        >
          <View style={styles.listIcon}>
            <Ionicons name="list" size={24} color="#2E8B57" />
          </View>
          <View style={styles.listInfo}>
            <Text style={styles.listName}>{list.name}</Text>
            <Text style={styles.listMeta}>
              {list.itemCount} items • {list.lastModified}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderFavoriteMarketsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>❤️ Favorite Markets</Text>
      {favoriteMarkets.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={48} color="#ccc" />
          <Text style={styles.emptyTitle}>No favorite markets yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart icon on any market to add it to your favorites
          </Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.favoriteMarketsGrid}>
            {favoriteMarkets.slice(0, 4).map((marketId) => (
              <View key={marketId} style={styles.favoriteMarketCard}>
                <View style={styles.favoriteMarketIcon}>
                  <Ionicons name="storefront" size={24} color="#2E8B57" />
                </View>
                <Text style={styles.favoriteMarketName} numberOfLines={2}>
                  Market #{marketId}
                </Text>
              </View>
            ))}
            {favoriteMarkets.length > 4 && (
              <View style={styles.favoriteMarketCard}>
                <View style={styles.favoriteMarketIcon}>
                  <Text style={styles.moreCount}>+{favoriteMarkets.length - 4}</Text>
                </View>
                <Text style={styles.favoriteMarketName}>More</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );

  const renderSeasonalCalendarSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🗓️ Seasonal Calendar</Text>
        <TouchableOpacity
          onPress={() => setSeasonalAlerts(!seasonalAlerts)}
          style={styles.toggleButton}
        >
          <Ionicons
            name={seasonalAlerts ? "notifications" : "notifications-off"}
            size={16}
            color={seasonalAlerts ? "#2E8B57" : "#ccc"}
          />
          <Text style={[
            styles.toggleText,
            { color: seasonalAlerts ? "#2E8B57" : "#ccc" }
          ]}>
            Alerts {seasonalAlerts ? 'On' : 'Off'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.seasonalSection}>
        <Text style={styles.seasonalTitle}>🟢 In Season Now</Text>
        <View style={styles.produceGrid}>
          {SEASONAL_PRODUCE.filter(p => p.season === 'current').map((produce) => (
            <View key={produce.name} style={styles.produceTag}>
              <Text style={styles.produceEmoji}>{produce.icon}</Text>
              <Text style={styles.produceName}>{produce.name}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.seasonalSection}>
        <Text style={styles.seasonalTitle}>🟡 Coming Soon</Text>
        <View style={styles.produceGrid}>
          {SEASONAL_PRODUCE.filter(p => p.season === 'coming-soon').map((produce) => (
            <View key={produce.name} style={[styles.produceTag, styles.produceTagComingSoon]}>
              <Text style={styles.produceEmoji}>{produce.icon}</Text>
              <Text style={styles.produceName}>{produce.name}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderShoppingListsSection()}
        {renderFavoriteMarketsSection()}
        {renderSeasonalCalendarSection()}
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
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e8f5e8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d0e8d0',
  },
  addButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#2E8B57',
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f5e8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  listMeta: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 200,
  },
  favoriteMarketsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  favoriteMarketCard: {
    width: 80,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  favoriteMarketIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e8f5e8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  favoriteMarketName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  moreCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E8B57',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  toggleText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  seasonalSection: {
    marginBottom: 20,
  },
  seasonalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  produceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  produceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e8f5e8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d0e8d0',
  },
  produceTagComingSoon: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
  },
  produceEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  produceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});

export default ListsScreen;