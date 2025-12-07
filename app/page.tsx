'use client';

import React, { useEffect, useState } from 'react';
import { useDashboardStore } from '@/lib/store';
import { useCoinData } from '@/hooks/useCoinData';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useFavorites } from '@/hooks/useFavorites';
import { Header } from '@/components/dashboard/Header';
import { CoinSelector } from '@/components/dashboard/CoinSelector';
import { TimeRangeSelector } from '@/components/dashboard/TimeRangeSelector';
import { CurrencySelector } from '@/components/dashboard/CurrencySelector';
import { CurrencyRates } from '@/components/dashboard/CurrencyRates';
import { PriceChart } from '@/components/charts/PriceChart';
import { TokenomicsOverview } from '@/components/dashboard/TokenomicsOverview';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Favorites } from '@/components/dashboard/Favorites';
import { PortfolioOverview } from '@/components/dashboard/PortfolioOverview';
import { CoinData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { NetworkStatus } from '@/components/ui/NetworkStatus';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Activity,
  AlertCircle,
  RefreshCw,
  Star
} from 'lucide-react';
import { sanitizeUrl, escapeHtml } from '@/lib/utils/sanitize';

export default function Dashboard() {
  const { 
    selectedCoin, 
    setSelectedCoin, 
    networkStatus, 
    setNetworkStatus,
    errorDetails,
    retryCount,
    timeRange,
    setTimeRange,
    currency,
    setCurrency,
  } = useDashboardStore();
  const { marketData, isLoading, error, errorDetails: hookErrorDetails, retryCount: hookRetryCount, refreshData } = useCoinData();
  const networkStatusHook = useNetworkStatus();
  const { exchangeRates, isLoading: ratesLoading, refreshRates } = useExchangeRates(currency);
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [favoriteCoins, setFavoriteCoins] = useState<CoinData[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);

  // Sync network status from hook to store
  useEffect(() => {
    // Only update if values actually changed to prevent infinite loops
    if (
      networkStatus.isOnline !== networkStatusHook.isOnline ||
      networkStatus.wasOffline !== networkStatusHook.wasOffline
    ) {
      setNetworkStatus(networkStatusHook);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkStatusHook.isOnline, networkStatusHook.wasOffline]);

  // Fetch favorite coins data for portfolio overview
  useEffect(() => {
    const fetchFavoriteCoins = async () => {
      if (favorites.length === 0) {
        setFavoriteCoins([]);
        return;
      }

      setIsLoadingFavorites(true);
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
        console.error('Error fetching favorite coins for portfolio:', error);
        setFavoriteCoins([]);
      } finally {
        setIsLoadingFavorites(false);
      }
    };

    fetchFavoriteCoins();
  }, [favorites]);

  // Auto-refresh favorite coins data periodically (every 30 seconds)
  useEffect(() => {
    if (favorites.length === 0) return;
    
    const interval = setInterval(async () => {
      try {
        const favoriteIds = favorites.map(fav => fav.id).join(',');
        const response = await fetch(`/api/coins/search?ids=${encodeURIComponent(favoriteIds)}&limit=${favorites.length}`);
        
        if (response.ok) {
          const data = await response.json();
          const sortedFavorites = favorites
            .map(fav => data.find((coin: CoinData) => coin.id === fav.id))
            .filter((coin): coin is CoinData => coin !== undefined);
          setFavoriteCoins(sortedFavorites);
        }
      } catch (error) {
        console.error('Error refreshing favorite coins:', error);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [favorites]);

  const displayErrorDetails = errorDetails || hookErrorDetails;
  const displayRetryCount = retryCount || hookRetryCount;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="max-w-md w-full mx-auto">
          <CardContent className="p-4 sm:p-6 text-center">
            <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              {displayErrorDetails?.isNetworkError 
                ? 'Connection Error' 
                : displayErrorDetails?.isTimeoutError
                ? 'Timeout Error'
                : displayErrorDetails?.isRateLimitError
                ? 'Rate Limit Exceeded'
                : 'Error Loading Data'}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-2 break-words">{escapeHtml(error)}</p>
            {displayErrorDetails && (
              <div className="text-xs sm:text-sm text-gray-500 mb-4">
                {displayErrorDetails.isNetworkError && (
                  <p>Please check your internet connection.</p>
                )}
                {displayErrorDetails.isTimeoutError && (
                  <p>The server is taking too long to respond.</p>
                )}
                {displayErrorDetails.isRateLimitError && (
                  <p>Too many requests. Please wait a moment.</p>
                )}
                {displayRetryCount > 0 && (
                  <p className="mt-2">Retry attempts: {displayRetryCount}</p>
                )}
              </div>
            )}
            <div className="flex flex-col space-y-2">
              {networkStatus && !networkStatus.isOnline && (
                <NetworkStatus
                  isOnline={networkStatus.isOnline}
                  wasOffline={networkStatus.wasOffline}
                  className="mb-4"
                />
              )}
              <button
                onClick={refreshData}
                disabled={networkStatus && !networkStatus.isOnline}
                className="min-h-[44px] px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 active:bg-primary-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 touch-manipulation active:scale-[0.97] select-none"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onRefresh={refreshData}
        isLoading={isLoading}
        lastUpdated={marketData ? new Date() : null}
        networkStatus={networkStatus}
      />
      
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 lg:py-8">
        {/* Coin and Currency Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4 md:mb-6 lg:mb-8">
          <div className="flex gap-2 sm:gap-3">
            <div className="flex-1">
              <CoinSelector
                selectedCoin={selectedCoin}
                onCoinSelect={setSelectedCoin}
              />
            </div>
            {marketData?.coin && (
              <button
                onClick={() => toggleFavorite(marketData.coin)}
                className={`
                  px-3 sm:px-4 py-2 rounded-md border transition-all
                  min-h-[44px] sm:min-h-[40px] min-w-[44px] sm:min-w-[44px]
                  touch-manipulation active:scale-[0.97] select-none
                  flex items-center justify-center
                  ${isFavorite(marketData.coin.id)
                    ? 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }
                `}
                aria-label={isFavorite(marketData.coin.id) ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star 
                  className={`h-5 w-5 ${isFavorite(marketData.coin.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} 
                />
              </button>
            )}
          </div>
          <CurrencySelector
            selectedCurrency={currency}
            onCurrencySelect={setCurrency}
          />
        </div>

        {/* Favorites - Quick Access Watchlist */}
        <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-8 sticky top-4 z-30">
          <Favorites
            selectedCoin={selectedCoin}
            onCoinSelect={setSelectedCoin}
          />
        </div>

        {/* Portfolio Overview */}
        {favoriteCoins.length > 0 && (
          <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
            <PortfolioOverview coins={favoriteCoins} currency={currency} />
          </div>
        )}

        {/* Currency Exchange Rates */}
        <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
          <CurrencyRates
            exchangeRates={exchangeRates}
            baseCurrency={currency}
            isLoading={ratesLoading}
            onRefresh={refreshRates}
          />
        </div>

        {/* Time Range Selector */}
        {marketData && (
          <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
            <TimeRangeSelector
              selectedRange={timeRange}
              onRangeChange={setTimeRange}
            />
          </div>
        )}

        {isLoading && !marketData ? (
          <div className="flex items-center justify-center py-12 sm:py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-sm sm:text-base text-gray-600">Loading coin data...</p>
            </div>
          </div>
        ) : marketData ? (
          <>
            {/* Price Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6 mb-4 sm:mb-6 md:mb-8">
              <div className="lg:col-span-2 order-1 min-w-0">
                <Card className="overflow-hidden">
                  <CardHeader className="p-3 sm:p-4 md:p-5 lg:p-6">
                    <CardTitle className="flex items-center text-sm sm:text-base md:text-lg">
                      <img
                        src={sanitizeUrl(marketData.coin.image)}
                        alt={escapeHtml(marketData.coin.name)}
                        className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 mr-2 sm:mr-3 rounded-full flex-shrink-0"
                      />
                      <span className="truncate">{escapeHtml(marketData.coin.name)} Price Chart</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-3 md:p-4 lg:p-6 min-w-0">
                    <PriceChart data={marketData.priceHistory} currency={currency} />
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4 order-2">
                <MetricCard
                  title="Current Price"
                  value={marketData.coin.current_price}
                  change={marketData.coin.price_change_percentage_24h ?? undefined}
                  changeType={marketData.coin.price_change_percentage_24h !== null && marketData.coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}
                  icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />}
                  currency={currency}
                />
                
                <MetricCard
                  title="Market Cap"
                  value={marketData.coin.market_cap}
                  change={marketData.coin.market_cap_change_percentage_24h ?? undefined}
                  changeType={marketData.coin.market_cap_change_percentage_24h !== null && marketData.coin.market_cap_change_percentage_24h >= 0 ? 'positive' : 'negative'}
                  icon={<BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />}
                  currency={currency}
                />
                
                <MetricCard
                  title="24h Volume"
                  value={marketData.coin.total_volume}
                  icon={<Activity className="h-4 w-4 sm:h-5 sm:w-5" />}
                  currency={currency}
                />
                
                <MetricCard
                  title="24h High"
                  value={marketData.coin.high_24h ?? 0}
                  icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />}
                  currency={currency}
                />
                
                <MetricCard
                  title="24h Low"
                  value={marketData.coin.low_24h ?? 0}
                  icon={<TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />}
                  currency={currency}
                />
              </div>
            </div>

            {/* Tokenomics Overview */}
            <div className="order-3 min-w-0">
              <TokenomicsOverview tokenomics={marketData.tokenomics} currency={currency} />
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
