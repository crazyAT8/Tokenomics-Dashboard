import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DashboardState, MarketData, ChartType, TechnicalAnalysisSettings, ChartCustomizationSettings, Theme } from './types';
import { ApiError } from './utils/errorHandler';
import { TimeRange } from '@/components/dashboard/TimeRangeSelector';

export type Currency = 'usd' | 'eur' | 'gbp' | 'jpy' | 'cad' | 'aud' | 'chf' | 'cny' | 'inr' | 'krw';

interface ExtendedDashboardState extends DashboardState {
  networkStatus: {
    isOnline: boolean;
    wasOffline: boolean;
  };
  errorDetails: ApiError | null;
  retryCount: number;
  timeRange: TimeRange;
  currency: Currency;
  chartType: ChartType;
  technicalAnalysis: TechnicalAnalysisSettings;
  chartCustomization: ChartCustomizationSettings;
  theme: Theme;
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
  setCurrency: (currency: Currency) => void;
  setChartType: (chartType: ChartType) => void;
  setTechnicalAnalysis: (settings: Partial<TechnicalAnalysisSettings>) => void;
  toggleTechnicalIndicator: (indicator: keyof TechnicalAnalysisSettings) => void;
  setChartCustomization: (settings: Partial<ChartCustomizationSettings>) => void;
  resetChartCustomization: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
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
      currency: 'usd',
      chartType: 'line',
      technicalAnalysis: {
        showSMA20: false,
        showSMA50: false,
        showSMA200: false,
        showEMA20: false,
        showEMA50: false,
        showRSI: false,
        showMACD: false,
        showBollingerBands: false,
        showSupportResistance: false,
      },
      chartCustomization: {
        lineColor: '#3b82f6',
        backgroundColor: '#ffffff',
        gridColor: '#f0f0f0',
        axisColor: '#666666',
        showGrid: true,
        showAxisLabels: true,
        chartHeight: null,
        lineWidth: 2.5,
        fontSize: 12,
        theme: 'light',
        enableAnimation: true,
      },
      theme: 'light',

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
      setCurrency: (currency) => set({ currency }),
      setChartType: (chartType) => set({ chartType }),
      setTechnicalAnalysis: (settings) =>
        set((state) => ({
          technicalAnalysis: { ...state.technicalAnalysis, ...settings },
        })),
      toggleTechnicalIndicator: (indicator) =>
        set((state) => ({
          technicalAnalysis: {
            ...state.technicalAnalysis,
            [indicator]: !state.technicalAnalysis[indicator],
          },
        })),
      setChartCustomization: (settings) =>
        set((state) => ({
          chartCustomization: { ...state.chartCustomization, ...settings },
        })),
      resetChartCustomization: () =>
        set({
          chartCustomization: {
            lineColor: '#3b82f6',
            backgroundColor: '#ffffff',
            gridColor: '#f0f0f0',
            axisColor: '#666666',
            showGrid: true,
            showAxisLabels: true,
            chartHeight: null,
            lineWidth: 2.5,
            fontSize: 12,
            theme: 'light',
            enableAnimation: true,
          },
        }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),
    }),
    {
      name: 'dashboard-storage',
      partialize: (state) => ({ 
        currency: state.currency,
        selectedCoin: state.selectedCoin,
        timeRange: state.timeRange,
        chartType: state.chartType,
        technicalAnalysis: state.technicalAnalysis,
        chartCustomization: state.chartCustomization,
        theme: state.theme,
      }),
    }
  )
);
