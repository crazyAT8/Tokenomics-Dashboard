'use client';

import { useEffect, useState, useCallback } from 'react';
import { ExchangeRates } from '@/lib/types';
import { Currency } from '@/lib/store';

export const useExchangeRates = (baseCurrency: Currency = 'usd') => {
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/exchange-rates?base=${baseCurrency}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setExchangeRates(data);
    } catch (err: any) {
      console.error('Error fetching exchange rates:', err);
      setError(err.message || 'Failed to fetch exchange rates');
    } finally {
      setIsLoading(false);
    }
  }, [baseCurrency]);

  useEffect(() => {
    fetchRates();
    // Refresh rates every 5 minutes
    const interval = setInterval(fetchRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRates]);

  return {
    exchangeRates,
    isLoading,
    error,
    refreshRates: fetchRates,
  };
};

