'use client';

import { useState, useEffect, useCallback } from 'react';
import { CoinData } from '@/lib/types';

const FAVORITES_STORAGE_KEY = 'tokenomics-dashboard-favorites';

interface FavoriteCoin {
  id: string;
  name: string;
  symbol: string;
  image: string;
  addedAt: number;
}

/**
 * Hook to manage favorite coins in local storage
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteCoin[]>([]);

  // Load favorites from local storage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setFavorites(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Error loading favorites from local storage:', error);
      setFavorites([]);
    }
  }, []);

  // Save favorites to local storage whenever they change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error('Error saving favorites to local storage:', error);
    }
  }, [favorites]);

  const addFavorite = useCallback((coin: CoinData | FavoriteCoin) => {
    setFavorites((prev) => {
      // Check if already a favorite
      if (prev.some((fav) => fav.id === coin.id)) {
        return prev;
      }
      
      const favorite: FavoriteCoin = {
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        image: coin.image,
        addedAt: Date.now(),
      };
      
      return [...prev, favorite];
    });
  }, []);

  const removeFavorite = useCallback((coinId: string) => {
    setFavorites((prev) => prev.filter((fav) => fav.id !== coinId));
  }, []);

  const toggleFavorite = useCallback((coin: CoinData | FavoriteCoin) => {
    setFavorites((prev) => {
      const isFavorite = prev.some((fav) => fav.id === coin.id);
      
      if (isFavorite) {
        return prev.filter((fav) => fav.id !== coin.id);
      } else {
        const favorite: FavoriteCoin = {
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          image: coin.image,
          addedAt: Date.now(),
        };
        return [...prev, favorite];
      }
    });
  }, []);

  const isFavorite = useCallback((coinId: string) => {
    return favorites.some((fav) => fav.id === coinId);
  }, [favorites]);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearFavorites,
  };
}

