'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CoinData,
  PortfolioEntry,
  PortfolioTransaction,
  PortfolioTransactionType,
  PortfolioContribution,
  PortfolioState,
} from '@/lib/types';

const PORTFOLIO_STORAGE_KEY = 'tokenomics-dashboard-portfolio';
const DEFAULT_PORTFOLIO_STATE: PortfolioState = {
  entries: [],
  transactions: [],
  contributions: [],
};

/**
 * Hook to manage portfolio coins with quantities in local storage
 */
export function usePortfolio() {
  const [portfolioState, setPortfolioState] = useState<PortfolioState>(DEFAULT_PORTFOLIO_STATE);

  const calculatePositionFromTransactions = useCallback((transactions: PortfolioTransaction[]) => {
    let quantity = 0;
    let costBasis = 0;
    let realizedPnl = 0;

    const sorted = [...transactions].sort((a, b) => a.timestamp - b.timestamp);
    sorted.forEach((tx) => {
      const fee = tx.fee ?? 0;
      if (tx.type === 'buy') {
        costBasis += tx.price * tx.quantity + fee;
        quantity += tx.quantity;
      } else {
        const sellQty = Math.min(tx.quantity, quantity);
        if (sellQty <= 0 || quantity <= 0) return;
        const avgCost = quantity > 0 ? costBasis / quantity : 0;
        const proceeds = tx.price * sellQty - fee;
        realizedPnl += proceeds - avgCost * sellQty;
        costBasis -= avgCost * sellQty;
        quantity -= sellQty;
      }
    });

    if (costBasis < 0.00000001) {
      costBasis = 0;
    }

    return {
      quantity,
      costBasis,
      realizedPnl,
      averageCost: quantity > 0 ? costBasis / quantity : undefined,
    };
  }, []);

  // Load portfolio from local storage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);

        // Backward compatibility: older versions stored an array of entries
        if (Array.isArray(parsed)) {
          setPortfolioState({
            entries: parsed,
            transactions: [],
            contributions: [],
          });
          return;
        }

        const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
        const transactions = Array.isArray(parsed.transactions) ? parsed.transactions : [];
        const contributions = Array.isArray(parsed.contributions) ? parsed.contributions : [];

        setPortfolioState({
          entries,
          transactions,
          contributions,
        });
      }
    } catch (error) {
      console.error('Error loading portfolio from local storage:', error);
      setPortfolioState(DEFAULT_PORTFOLIO_STATE);
    }
  }, []);

  // Save portfolio to local storage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(portfolioState));
    } catch (error) {
      console.error('Error saving portfolio to local storage:', error);
    }
  }, [portfolioState]);

  const addCoin = useCallback((
    coin: CoinData | PortfolioEntry,
    quantity: number,
    purchasePrice?: number
  ) => {
    setPortfolioState((prev) => {
      // Check if coin already exists in portfolio
      const existingIndex = prev.entries.findIndex((entry) => entry.coinId === coin.id);
      
      if (existingIndex >= 0) {
        // Update existing entry - add to quantity
        const updated = [...prev.entries];
        const existingEntry = updated[existingIndex];
        const newQuantity = existingEntry.quantity + quantity;
        
        // Calculate weighted average purchase price if both have prices
        let newPurchasePrice: number | undefined;
        if (existingEntry.purchasePrice && purchasePrice) {
          // Weighted average: (old_price * old_quantity + new_price * new_quantity) / total_quantity
          const oldCostBasis = existingEntry.purchasePrice * existingEntry.quantity;
          const newCostBasis = purchasePrice * quantity;
          newPurchasePrice = (oldCostBasis + newCostBasis) / newQuantity;
        } else {
          // Use whichever price is available
          newPurchasePrice = purchasePrice || existingEntry.purchasePrice;
        }
        
        updated[existingIndex] = {
          ...existingEntry,
          quantity: newQuantity,
          purchasePrice: newPurchasePrice,
        };
        return {
          ...prev,
          entries: updated,
        };
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
      
      return {
        ...prev,
        entries: [...prev.entries, entry],
      };
    });
  }, []);

  const removeCoin = useCallback((coinId: string) => {
    setPortfolioState((prev) => ({
      ...prev,
      entries: prev.entries.filter((entry) => entry.coinId !== coinId),
      transactions: prev.transactions.filter((tx) => tx.coinId !== coinId),
    }));
  }, []);

  const updateQuantity = useCallback((coinId: string, quantity: number) => {
    if (quantity <= 0) {
      removeCoin(coinId);
      return;
    }

    setPortfolioState((prev) => ({
      ...prev,
      entries: prev.entries.map((entry) =>
        entry.coinId === coinId ? { ...entry, quantity } : entry
      ),
    }));
  }, [removeCoin]);

  const updatePurchasePrice = useCallback((coinId: string, purchasePrice: number | undefined) => {
    setPortfolioState((prev) => ({
      ...prev,
      entries: prev.entries.map((entry) =>
        entry.coinId === coinId ? { ...entry, purchasePrice } : entry
      ),
    }));
  }, []);

  const isInPortfolio = useCallback((coinId: string) => {
    return portfolioState.entries.some((entry) => entry.coinId === coinId);
  }, [portfolioState.entries]);

  const getPortfolioEntry = useCallback((coinId: string) => {
    return portfolioState.entries.find((entry) => entry.coinId === coinId);
  }, [portfolioState.entries]);

  const clearPortfolio = useCallback(() => {
    setPortfolioState(DEFAULT_PORTFOLIO_STATE);
  }, []);

  const addTransaction = useCallback((
    coin: CoinData | PortfolioEntry,
    type: PortfolioTransactionType,
    quantity: number,
    price: number,
    fee?: number,
    timestamp: number = Date.now(),
    note?: string,
  ) => {
    if (quantity <= 0 || price < 0 || (fee ?? 0) < 0) return;

    setPortfolioState((prev) => {
      const transaction: PortfolioTransaction = {
        id: `${coin.id}-${timestamp}-${Math.random().toString(36).slice(2, 6)}`,
        coinId: coin.id,
        type,
        quantity,
        price,
        fee: fee && fee > 0 ? fee : undefined,
        timestamp,
        note,
      };

      const transactions = [...prev.transactions, transaction];
      const existingIndex = prev.entries.findIndex((entry) => entry.coinId === coin.id);
      const nextEntries = [...prev.entries];
      let targetEntry = existingIndex >= 0 ? nextEntries[existingIndex] : undefined;

      if (!targetEntry) {
        targetEntry = {
          id: `${coin.id}-${Date.now()}`,
          coinId: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          image: coin.image,
          quantity: 0,
          purchasePrice: undefined,
          addedAt: timestamp,
        };
        nextEntries.push(targetEntry);
      }

      const stats = calculatePositionFromTransactions(
        transactions.filter((tx) => tx.coinId === coin.id)
      );

      const updatedEntry: PortfolioEntry = {
        ...targetEntry,
        quantity: stats.quantity,
        purchasePrice: stats.averageCost ?? targetEntry.purchasePrice,
      };

      if (existingIndex >= 0) {
        nextEntries[existingIndex] = updatedEntry;
      } else {
        nextEntries[nextEntries.length - 1] = updatedEntry;
      }

      return {
        ...prev,
        entries: nextEntries,
        transactions,
      };
    });
  }, [calculatePositionFromTransactions]);

  const addContribution = useCallback((
    type: 'contribution' | 'withdrawal',
    amount: number,
    timestamp: number = Date.now(),
    note?: string,
  ) => {
    if (amount <= 0) return;
    setPortfolioState((prev) => ({
      ...prev,
      contributions: [
        ...prev.contributions,
        {
          id: `${type}-${timestamp}-${Math.random().toString(36).slice(2, 6)}`,
          type,
          amount,
          timestamp,
          note,
        },
      ],
    }));
  }, []);

  return {
    portfolio: portfolioState.entries,
    transactions: portfolioState.transactions,
    contributions: portfolioState.contributions,
    addCoin,
    removeCoin,
    updateQuantity,
    updatePurchasePrice,
    addTransaction,
    addContribution,
    isInPortfolio,
    getPortfolioEntry,
    clearPortfolio,
    calculatePositionFromTransactions,
  };
}

