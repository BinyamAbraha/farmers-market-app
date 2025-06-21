import { useState, useEffect, useCallback } from 'react';
import {
  loadFavorites,
  saveFavorites,
  addToFavorites,
  removeFromFavorites,
} from '../utils/favoritesStorage';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const favs = await loadFavorites();
      setFavorites(favs);
      setLoading(false);
    })();
  }, []);

  const toggleFavorite = useCallback(async (marketId: string) => {
    setFavorites(prev => {
      if (prev.includes(marketId)) {
        const updated = prev.filter(id => id !== marketId);
        saveFavorites(updated);
        return updated;
      } else {
        const updated = [...prev, marketId];
        saveFavorites(updated);
        return updated;
      }
    });
  }, []);

  const checkIsFavorite = useCallback((marketId: string) => {
    return favorites.includes(marketId);
  }, [favorites]);

  return {
    favorites,
    favoriteMarkets: favorites, // Alias for compatibility
    loading,
    toggleFavorite,
    checkIsFavorite,
    setFavorites, // for advanced use
  };
} 