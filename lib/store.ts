import { create } from 'zustand';
import { DashboardState, MarketData } from './types';
import { ApiError } from './utils/errorHandler';
import { TimeRange } from '@/components/dashboard/TimeRangeSelector';

interface ExtendedDashboardState extends DashboardState {
  networkStatus: {
    isOnline: boolean;
    wasOffline: boolean;
  };
  errorDetails: ApiError | null;
  retryCount: number;
  timeRange: TimeRange;
}

interface DashboardStore extends ExtendedDashboardState {
  setSelectedCoin: (coin: string) => void;
  setMarketData: (data: MarketData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null, errorDetails?: ApiError | null) => void;
  updateLastUpdated: () => void;
  clearError: () => void;
  setNetworkStatus: (status: { isOnline: boolean; wasOffline: boolean }) => void;
  incrementRetryCount: () => void;
  resetRetryCount: () => void;
  setTimeRange: (range: TimeRange) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  selectedCoin: 'bitcoin',
  marketData: null,
  isLoading: false,
  error: null,
  errorDetails: null,
  lastUpdated: null,
  networkStatus: {
    isOnline: true,
    wasOffline: false,
  },
  retryCount: 0,
  timeRange: { type: '7d', days: 7 },

  setSelectedCoin: (coin) => set({ selectedCoin: coin }),
  setMarketData: (data) => set({ marketData: data, error: null, errorDetails: null, retryCount: 0 }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error, errorDetails = null) => 
    set({ error, errorDetails, isLoading: false }),
  updateLastUpdated: () => set({ lastUpdated: new Date() }),
  clearError: () => set({ error: null, errorDetails: null, retryCount: 0 }),
  setNetworkStatus: (status) => set({ networkStatus: status }),
  incrementRetryCount: () => set((state) => ({ retryCount: state.retryCount + 1 })),
  resetRetryCount: () => set({ retryCount: 0 }),
  setTimeRange: (range) => set({ timeRange: range }),
}));
