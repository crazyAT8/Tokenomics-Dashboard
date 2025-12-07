'use client';

import React, { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CoinData } from '@/lib/types';
import { useFavorites } from '@/hooks/useFavorites';
import { sanitizeUrl, escapeHtml } from '@/lib/utils/sanitize';

interface FavoritesProps {
  selectedCoin: string;
  onCoinSelect: (coinId: string) => void;
}

export const Favorites: React.FC<FavoritesProps> = ({
  selectedCoin,
  onCoinSelect,
}) => {
  const { favorites, removeFavorite, isFavorite } = useFavorites();
  const [favoriteCoins, setFavoriteCoins] = useState<CoinData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFavoriteCoins = async () => {
    if (favorites.length === 0) {
      setFavoriteCoins([]);
      return;
    }

    setIsLoading(true);
    try {
      const favoriteIds = favorites.map(fav => fav.id).join(',');
      const response = await fetch(`/api/coins/search?ids=${encodeURIComponent(favoriteIds)}&limit=${favorites.length}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch favorite coins: ${response.statusText}`);
      }
      
      const data = await response.json();
      // Sort favorites to maintain the order they were added
      const sortedFavorites = favorites
        .map(fav => data.find((coin: CoinData) => coin.id === fav.id))
        .filter((coin): coin is CoinData => coin !== undefined);
      
      setFavoriteCoins(sortedFavorites);
    } catch (error) {
      console.error('Error fetching favorite coins:', error);
      setFavoriteCoins([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavoriteCoins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favorites]);

  if (favorites.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="p-3 sm:p-4 md:p-5 lg:p-6">
        <CardTitle className="text-sm sm:text-base md:text-lg flex items-center">
          <Star className="h-4 w-4 sm:h-5 sm:w-5 mr-2 fill-yellow-400 text-yellow-400" />
          Favorites
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-5 lg:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        ) : favoriteCoins.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Loading favorites...</p>
        ) : (
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {favoriteCoins.map((coin) => (
              <button
                key={coin.id}
                onClick={() => onCoinSelect(coin.id)}
                className={`
                  flex items-center px-3 py-2 rounded-lg border transition-all
                  min-h-[44px] touch-manipulation active:scale-[0.97]
                  ${selectedCoin === coin.id
                    ? 'bg-primary-50 border-primary-300 text-primary-900'
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <img
                  src={sanitizeUrl(coin.image)}
                  alt={escapeHtml(coin.name)}
                  className="w-5 h-5 sm:w-6 sm:h-6 mr-2 rounded-full flex-shrink-0"
                />
                <span className="text-sm sm:text-base font-medium text-gray-900 mr-2">
                  {escapeHtml(coin.name)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFavorite(coin.id);
                  }}
                  className="ml-1 p-1 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
                  aria-label="Remove from favorites"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 hover:text-red-500" />
                </button>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

