'use client';

import { useEffect, useCallback } from 'react';
import { useDashboardStore } from '@/lib/store';

export const useCoinData = () => {
  const {
    selectedCoin,
    marketData,
    isLoading,
    error,
    setMarketData,
    setLoading,
    setError,
    updateLastUpdated,
  } = useDashboardStore();

  const fetchCoinData = useCallback(async () => {
    if (!selectedCoin) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching data for coin:', selectedCoin, typeof selectedCoin);
      const response = await fetch(`/api/coins/${selectedCoin}?days=7`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch coin data');
      }

      const data = await response.json();
      console.log('Received data:', data);
      setMarketData(data);
      updateLastUpdated();
    } catch (err) {
      console.error('Error fetching coin data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [selectedCoin, setMarketData, setLoading, setError, updateLastUpdated]);

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
    refreshData,
  };
};
