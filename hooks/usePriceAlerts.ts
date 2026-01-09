'use client';

import { useState, useEffect, useCallback } from 'react';
import { PriceAlert, PriceAlertType, CoinData } from '@/lib/types';
import { Currency } from '@/lib/store';

/**
 * Hook to manage price alerts using database storage via API
 */
export function usePriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load alerts from API on mount
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/alerts');
        if (!response.ok) {
          throw new Error('Failed to fetch alerts');
        }
        const data = await response.json();
        setAlerts(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error('Failed to load price alerts:', err);
        setError(err.message || 'Failed to load alerts');
        setAlerts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const addAlert = useCallback(async (
    coin: CoinData,
    targetPrice: number,
    type: PriceAlertType,
    currency: Currency,
    note?: string,
    emailNotification?: boolean,
    emailAddress?: string,
    browserNotification?: boolean
  ): Promise<string> => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coinId: coin.id,
          coinName: coin.name,
          coinSymbol: coin.symbol,
          coinImage: coin.image,
          targetPrice,
          type,
          currency,
          isActive: true,
          createdAt: Date.now(),
          note,
          emailNotification,
          emailAddress,
          browserNotification,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to create alert');
      }

      const newAlert = await response.json();
      setAlerts((prev) => [...prev, newAlert]);
      return newAlert.id;
    } catch (err: any) {
      console.error('Failed to add alert:', err);
      setError(err.message || 'Failed to add alert');
      throw err;
    }
  }, []);

  const removeAlert = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/alerts?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to delete alert');
      }

      setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    } catch (err: any) {
      console.error('Failed to remove alert:', err);
      setError(err.message || 'Failed to remove alert');
      throw err;
    }
  }, []);

  const updateAlert = useCallback(async (id: string, updates: Partial<PriceAlert>) => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          ...updates,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to update alert');
      }

      const updatedAlert = await response.json();
      setAlerts((prev) =>
        prev.map((alert) => (alert.id === id ? updatedAlert : alert))
      );
    } catch (err: any) {
      console.error('Failed to update alert:', err);
      setError(err.message || 'Failed to update alert');
      throw err;
    }
  }, []);

  const toggleAlert = useCallback(async (id: string) => {
    const alert = alerts.find((a) => a.id === id);
    if (!alert) return;

    try {
      await updateAlert(id, { isActive: !alert.isActive });
    } catch (err) {
      // Error already handled in updateAlert
    }
  }, [alerts, updateAlert]);

  const getAlertsForCoin = useCallback((coinId: string) => {
    return alerts.filter((alert) => alert.coinId === coinId);
  }, [alerts]);

  const getActiveAlerts = useCallback(() => {
    return alerts.filter((alert) => alert.isActive && !alert.triggeredAt);
  }, [alerts]);

  const markAlertAsTriggered = useCallback(async (id: string) => {
    try {
      await updateAlert(id, {
        triggeredAt: Date.now(),
        isActive: false,
      });
    } catch (err) {
      // Error already handled in updateAlert
    }
  }, [updateAlert]);

  const refreshAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/alerts');
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }
      const data = await response.json();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to refresh alerts:', err);
      setError(err.message || 'Failed to refresh alerts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    alerts,
    isLoading,
    error,
    addAlert,
    removeAlert,
    updateAlert,
    toggleAlert,
    getAlertsForCoin,
    getActiveAlerts,
    markAlertAsTriggered,
    refreshAlerts,
  };
}

