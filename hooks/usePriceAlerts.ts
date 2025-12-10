'use client';

import { useState, useEffect, useCallback } from 'react';
import { PriceAlert, PriceAlertType, CoinData } from '@/lib/types';
import { Currency } from '@/lib/store';

const PRICE_ALERTS_STORAGE_KEY = 'tokenomics-dashboard-price-alerts';

/**
 * Hook to manage price alerts in local storage
 */
export function usePriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);

  // Load alerts from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PRICE_ALERTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setAlerts(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Failed to load price alerts:', error);
      setAlerts([]);
    }
  }, []);

  // Save alerts to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(PRICE_ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    } catch (error) {
      console.error('Failed to save price alerts:', error);
    }
  }, [alerts]);

  const addAlert = useCallback((
    coin: CoinData,
    targetPrice: number,
    type: PriceAlertType,
    currency: Currency,
    note?: string,
    emailNotification?: boolean,
    emailAddress?: string,
    browserNotification?: boolean
  ) => {
    const newAlert: PriceAlert = {
      id: `${coin.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
    };

    setAlerts((prev) => [...prev, newAlert]);
    return newAlert.id;
  }, []);

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  const updateAlert = useCallback((id: string, updates: Partial<PriceAlert>) => {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === id ? { ...alert, ...updates } : alert))
    );
  }, []);

  const toggleAlert = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, isActive: !alert.isActive } : alert
      )
    );
  }, []);

  const getAlertsForCoin = useCallback((coinId: string) => {
    return alerts.filter((alert) => alert.coinId === coinId);
  }, [alerts]);

  const getActiveAlerts = useCallback(() => {
    return alerts.filter((alert) => alert.isActive && !alert.triggeredAt);
  }, [alerts]);

  const markAlertAsTriggered = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, triggeredAt: Date.now(), isActive: false } : alert
      )
    );
  }, []);

  return {
    alerts,
    addAlert,
    removeAlert,
    updateAlert,
    toggleAlert,
    getAlertsForCoin,
    getActiveAlerts,
    markAlertAsTriggered,
  };
}

