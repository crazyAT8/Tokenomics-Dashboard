'use client';

import { useEffect, useCallback } from 'react';
import { useDashboardStore } from '@/lib/store';
import { parseError } from '@/lib/utils/errorHandler';
import { retry } from '@/lib/utils/retry';

export const useCoinData = () => {
  const {
    selectedCoin,
    marketData,
    isLoading,
    error,
    errorDetails,
    networkStatus,
    retryCount,
    timeRange,
    setMarketData,
    setLoading,
    setError,
    updateLastUpdated,
    incrementRetryCount,
    resetRetryCount,
  } = useDashboardStore();

  const fetchCoinData = useCallback(async () => {
    if (!selectedCoin) return;
    
    // Don't attempt fetch if offline
    if (!networkStatus.isOnline) {
      const parsedError = parseError({ code: 'NETWORK_OFFLINE', message: 'No internet connection' });
      setError('No internet connection. Please check your network and try again.', parsedError);
      return;
    }

    setLoading(true);
    setError(null);
    resetRetryCount();

    try {
      console.log('Fetching data for coin:', selectedCoin, typeof selectedCoin);
      
      // Build query parameters based on time range
      const params = new URLSearchParams();
      if (timeRange.type === 'custom' && timeRange.from && timeRange.to) {
        params.append('from', timeRange.from.toISOString());
        params.append('to', timeRange.to.toISOString());
      } else if (timeRange.days) {
        params.append('days', timeRange.days.toString());
      } else {
        params.append('days', '7'); // Default fallback
      }
      
      const data = await retry(async () => {
        const response = await fetch(`/api/coins/${selectedCoin}?${params.toString()}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error = new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
          (error as any).response = { status: response.status, data: errorData };
          throw error;
        }

        return await response.json();
      }, {
        maxRetries: 3,
        initialDelay: 1000,
      });

      console.log('Received data:', data);
      setMarketData(data);
      updateLastUpdated();
      resetRetryCount();
    } catch (err: any) {
      console.error('Error fetching coin data:', err);
      incrementRetryCount();
      const parsedError = err.parsedError || parseError(err);
      const errorMessage = parsedError.message || (err instanceof Error ? err.message : 'An error occurred');
      setError(errorMessage, parsedError);
    } finally {
      setLoading(false);
    }
  }, [
    selectedCoin, 
    timeRange,
    networkStatus.isOnline,
    setMarketData, 
    setLoading, 
    setError, 
    updateLastUpdated,
    incrementRetryCount,
    resetRetryCount,
  ]);

  useEffect(() => {
    fetchCoinData();
  }, [fetchCoinData]);

  const refreshData = useCallback(() => {
    fetchCoinData();
  }, [fetchCoinData]);

  return {
    marketData,
    isLoading,
    error,
    errorDetails,
    retryCount,
    refreshData,
  };
};
