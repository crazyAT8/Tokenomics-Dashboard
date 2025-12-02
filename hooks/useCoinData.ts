'use client';

import { useEffect, useCallback, useRef, useMemo } from 'react';
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
    currency,
    setMarketData,
    setLoading,
    setError,
    updateLastUpdated,
    incrementRetryCount,
    resetRetryCount,
  } = useDashboardStore();

  // Create a stable key for timeRange to prevent unnecessary refetches
  const timeRangeKeyRef = useRef<string>('');
  const lastFetchRef = useRef<{ coin: string; key: string } | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate a stable key from timeRange
  const getTimeRangeKey = useCallback((range: typeof timeRange) => {
    if (range.type === 'custom' && range.from && range.to) {
      return `${range.type}-${range.from.getTime()}-${range.to.getTime()}`;
    }
    return `${range.type}-${range.days || 7}`;
  }, []);

  // Create a stable key for the current time range and currency to track changes
  // Use individual properties to ensure proper reactivity
  const currentTimeRangeKey = useMemo(() => `${getTimeRangeKey(timeRange)}-${currency}`, [
    timeRange.type,
    timeRange.days,
    timeRange.from?.getTime(),
    timeRange.to?.getTime(),
    currency,
    getTimeRangeKey,
  ]);

  const fetchCoinData = useCallback(async () => {
    if (!selectedCoin) return;
    
    // Don't attempt fetch if offline
    if (!networkStatus.isOnline) {
      const parsedError = parseError({ code: 'NETWORK_OFFLINE', message: 'No internet connection' });
      setError('No internet connection. Please check your network and try again.', parsedError);
      return;
    }

    // Generate stable key for current request (use the memoized key)
    const currentKey = currentTimeRangeKey;
    const requestKey = `${selectedCoin}-${currentKey}`;
    
    // Skip if we're already fetching the same data
    if (lastFetchRef.current?.coin === selectedCoin && lastFetchRef.current?.key === currentKey) {
      console.log('Skipping fetch - same data already loaded:', requestKey);
      return;
    }

    setLoading(true);
    setError(null);
    resetRetryCount();

    try {
      console.log('Fetching data for coin:', selectedCoin, 'range:', currentKey);
      
      // Build query parameters based on time range and currency
      const params = new URLSearchParams();
      params.append('currency', currency);
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
      lastFetchRef.current = { coin: selectedCoin, key: currentKey };
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
    currentTimeRangeKey,
    networkStatus.isOnline,
    setMarketData, 
    setLoading, 
    setError, 
    updateLastUpdated,
    incrementRetryCount,
    resetRetryCount,
    getTimeRangeKey,
  ]);

  // Handle both coin and time range changes with debouncing
  useEffect(() => {
    if (!selectedCoin) return;

    // Clear any pending debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const currentKey = currentTimeRangeKey;
    
    // Only fetch if the key actually changed
    if (lastFetchRef.current?.coin === selectedCoin && lastFetchRef.current?.key === currentKey) {
      console.log('Skipping fetch - key unchanged:', currentKey);
      return;
    }

    // Update the ref to track the current key
    timeRangeKeyRef.current = currentKey;

    console.log('Time range changed, scheduling fetch. Coin:', selectedCoin, 'Key:', currentKey);

    // Debounce: wait 300ms before fetching to prevent rapid API calls
    debounceTimeoutRef.current = setTimeout(() => {
      fetchCoinData();
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [selectedCoin, currentTimeRangeKey, fetchCoinData]);

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
