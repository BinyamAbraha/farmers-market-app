import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = 'FAVORITE_MARKETS';

export async function saveFavorites(favorites: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error('Error saving favorites:', error);
    throw error;
  }
}

export async function loadFavorites(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading favorites:', error);
    return [];
  }
}

export async function addToFavorites(marketId: string): Promise<string[]> {
  try {
    const favorites = await loadFavorites();
    if (!favorites.includes(marketId)) {
      const updated = [...favorites, marketId];
      await saveFavorites(updated);
      return updated;
    }
    return favorites;
  } catch (error) {
    throw error;
  }
}

export async function removeFromFavorites(marketId: string): Promise<string[]> {
  try {
    const favorites = await loadFavorites();
    const updated = favorites.filter(id => id !== marketId);
    await saveFavorites(updated);
    return updated;
  } catch (error) {
    throw error;
  }
}

export async function isFavorite(marketId: string): Promise<boolean> {
  try {
    const favorites = await loadFavorites();
    return favorites.includes(marketId);
  } catch (error) {
    return false;
  }
} 