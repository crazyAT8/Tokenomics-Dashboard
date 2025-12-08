'use client';

import { useState, useEffect, useCallback } from 'react';
import { CoinData } from '@/lib/types';
import { PortfolioEntry } from '@/lib/types';

const PORTFOLIO_STORAGE_KEY = 'tokenomics-dashboard-portfolio';

/**
 * Hook to manage portfolio coins with quantities in local storage
 */
export function usePortfolio() {
  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([]);

  // Load portfolio from local storage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPortfolio(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Error loading portfolio from local storage:', error);
      setPortfolio([]);
    }
  }, []);

  // Save portfolio to local storage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(portfolio));
    } catch (error) {
      console.error('Error saving portfolio to local storage:', error);
    }
  }, [portfolio]);

  const addCoin = useCallback((
    coin: CoinData | PortfolioEntry,
    quantity: number,
    purchasePrice?: number
  ) => {
    setPortfolio((prev) => {
      // Check if coin already exists in portfolio
      const existingIndex = prev.findIndex((entry) => entry.coinId === coin.id);
      
      if (existingIndex >= 0) {
        // Update existing entry - add to quantity
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
          // Update purchase price if provided (weighted average could be calculated here)
          purchasePrice: purchasePrice || updated[existingIndex].purchasePrice,
        };
        return updated;
      }
      
      // Add new entry
      const entry: PortfolioEntry = {
        id: `${coin.id}-${Date.now()}`,
        coinId: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        image: coin.image,
        quantity,
        purchasePrice,
        addedAt: Date.now(),
      };
      
      return [...prev, entry];
    });
  }, []);

  const removeCoin = useCallback((coinId: string) => {
    setPortfolio((prev) => prev.filter((entry) => entry.coinId !== coinId));
  }, []);

  const updateQuantity = useCallback((coinId: string, quantity: number) => {
    if (quantity <= 0) {
      removeCoin(coinId);
      return;
    }

    setPortfolio((prev) =>
      prev.map((entry) =>
        entry.coinId === coinId ? { ...entry, quantity } : entry
      )
    );
  }, [removeCoin]);

  const updatePurchasePrice = useCallback((coinId: string, purchasePrice: number | undefined) => {
    setPortfolio((prev) =>
      prev.map((entry) =>
        entry.coinId === coinId ? { ...entry, purchasePrice } : entry
      )
    );
  }, []);

  const isInPortfolio = useCallback((coinId: string) => {
    return portfolio.some((entry) => entry.coinId === coinId);
  }, [portfolio]);

  const getPortfolioEntry = useCallback((coinId: string) => {
    return portfolio.find((entry) => entry.coinId === coinId);
  }, [portfolio]);

  const clearPortfolio = useCallback(() => {
    setPortfolio([]);
  }, []);

  return {
    portfolio,
    addCoin,
    removeCoin,
    updateQuantity,
    updatePurchasePrice,
    isInPortfolio,
    getPortfolioEntry,
    clearPortfolio,
  };
}

