import { create } from 'zustand';
import { DashboardState, MarketData } from './types';

interface DashboardStore extends DashboardState {
  setSelectedCoin: (coin: string) => void;
  setMarketData: (data: MarketData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateLastUpdated: () => void;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  selectedCoin: 'bitcoin',
  marketData: null,
  isLoading: false,
  error: null,
  lastUpdated: null,

  setSelectedCoin: (coin) => set({ selectedCoin: coin }),
  setMarketData: (data) => set({ marketData: data, error: null }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
  updateLastUpdated: () => set({ lastUpdated: new Date() }),
  clearError: () => set({ error: null }),
}));
