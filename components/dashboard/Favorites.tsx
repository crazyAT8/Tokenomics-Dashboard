'use client';

import React, { useState, useEffect } from 'react';
import { Star, X, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CoinData } from '@/lib/types';
import { useFavorites } from '@/hooks/useFavorites';
import { sanitizeUrl, escapeHtml } from '@/lib/utils/sanitize';
import { formatCurrency } from '@/lib/utils/currency';
import { useDashboardStore } from '@/lib/store';

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
  const currency = useDashboardStore((state) => state.currency);

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

  // Auto-refresh favorite coins data periodically (every 30 seconds)
  useEffect(() => {
    if (favorites.length === 0) return;
    
    const interval = setInterval(() => {
      fetchFavoriteCoins();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favorites.length]);

  if (favorites.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-3 sm:p-4 md:p-5 lg:p-6 pb-2 sm:pb-3">
        <CardTitle className="text-sm sm:text-base md:text-lg flex items-center">
          <Star className="h-4 w-4 sm:h-5 sm:w-5 mr-2 fill-yellow-400 text-yellow-400" />
          Quick Access Watchlist
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-5 lg:p-6 pt-2 sm:pt-3">
        {isLoading && favoriteCoins.length === 0 ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        ) : favoriteCoins.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Loading favorites...</p>
        ) : (
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-1 px-1 scroll-smooth">
            {favoriteCoins.map((coin) => {
              const priceChange = coin.price_change_percentage_24h ?? 0;
              const isPositive = priceChange >= 0;
              const isSelected = selectedCoin === coin.id;

              return (
                <button
                  key={coin.id}
                  onClick={() => onCoinSelect(coin.id)}
                  className={`
                    flex flex-col items-start px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border transition-all
                    min-w-[140px] sm:min-w-[160px] flex-shrink-0 touch-manipulation active:scale-[0.97]
                    ${isSelected
                      ? 'bg-primary-50 border-primary-400 shadow-md ring-2 ring-primary-200'
                      : 'bg-white border-gray-200 hover:border-primary-300 hover:bg-primary-50/50 hover:shadow-sm'
                    }
                  `}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <div className="flex items-center min-w-0 flex-1">
                      <img
                        src={sanitizeUrl(coin.image)}
                        alt={escapeHtml(coin.name)}
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex-shrink-0 mr-2"
                      />
                      <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                        {escapeHtml(coin.symbol.toUpperCase())}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFavorite(coin.id);
                      }}
                      className="ml-2 p-1 hover:bg-red-100 rounded-full transition-colors flex-shrink-0"
                      aria-label="Remove from favorites"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                  
                  <div className="w-full">
                    <div className="text-sm sm:text-base font-bold text-gray-900 mb-1">
                      {formatCurrency(coin.current_price, currency)}
                    </div>
                    <div className={`
                      flex items-center text-xs sm:text-sm font-medium
                      ${isPositive ? 'text-green-600' : 'text-red-600'}
                    `}>
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                      )}
                      <span>{Math.abs(priceChange).toFixed(2)}%</span>
                      <span className="text-gray-500 ml-1">24h</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

