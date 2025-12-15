// Polyfill for Next.js Request
if (typeof Request === 'undefined') {
  global.Request = class Request {
    constructor(public url: string, public init?: any) {}
  } as any;
}

import { NextRequest } from 'next/server';
import { GET as getCoinData } from '@/app/api/coins/[id]/route';
import { GET as searchCoins } from '@/app/api/coins/search/route';
import { GET as getExchangeRates } from '@/app/api/exchange-rates/route';
import * as apiClient from '@/lib/api';
import { getCache } from '@/lib/cache/cache';
import {
  mockCoinData,
  mockPriceHistory,
  mockOHLCData,
  mockExchangeRates,
} from './helpers/mockData';

// Mock the API client
jest.mock('@/lib/api');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock the cache
jest.mock('@/lib/cache/cache');
const mockedGetCache = getCache as jest.MockedFunction<typeof getCache>;

describe('API Routes Integration Tests', () => {
  let mockCache: {
    get: jest.Mock;
    set: jest.Mock;
    needsRefresh: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup cache mock
    mockCache = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      needsRefresh: jest.fn().mockResolvedValue(false),
    };
    mockedGetCache.mockReturnValue(mockCache as any);
  });

  describe('GET /api/coins/[id]', () => {
    const createRequest = (
      coinId: string,
      params?: { currency?: string; days?: string; chartType?: string; from?: string; to?: string }
    ) => {
      const searchParams = new URLSearchParams();
      if (params?.currency) searchParams.set('currency', params.currency);
      if (params?.days) searchParams.set('days', params.days);
      if (params?.chartType) searchParams.set('chartType', params.chartType);
      if (params?.from) searchParams.set('from', params.from);
      if (params?.to) searchParams.set('to', params.to);

      const url = `http://localhost:3000/api/coins/${coinId}?${searchParams.toString()}`;
      return new NextRequest(url);
    };

    it('should return coin data successfully', async () => {
      mockedApiClient.fetchCoinData.mockResolvedValue(mockCoinData);
      mockedApiClient.fetchPriceHistory.mockResolvedValue(mockPriceHistory);
      mockedApiClient.fetchOHLC.mockResolvedValue(mockOHLCData);

      const request = createRequest('bitcoin', { currency: 'usd', days: '7' });
      const response = await getCoinData(request, { params: { id: 'bitcoin' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('coin');
      expect(data).toHaveProperty('priceHistory');
      expect(data.coin.id).toBe('bitcoin');
      expect(mockedApiClient.fetchCoinData).toHaveBeenCalledWith('bitcoin', 'usd');
      expect(mockedApiClient.fetchPriceHistory).toHaveBeenCalled();
    });

    it('should return cached data when available', async () => {
      const cachedData = {
        coin: mockCoinData,
        priceHistory: mockPriceHistory,
        tokenomics: {
          circulating_supply: mockCoinData.circulating_supply,
          total_supply: mockCoinData.total_supply,
          max_supply: mockCoinData.max_supply,
          market_cap: mockCoinData.market_cap,
          fully_diluted_valuation: mockCoinData.fully_diluted_valuation,
          price: mockCoinData.current_price,
          price_change_24h: mockCoinData.price_change_24h,
          price_change_percentage_24h: mockCoinData.price_change_percentage_24h,
          volume_24h: mockCoinData.total_volume,
          market_cap_rank: mockCoinData.market_cap_rank,
        },
      };

      mockCache.get.mockResolvedValue(cachedData);

      const request = createRequest('bitcoin', { currency: 'usd', days: '7' });
      const response = await getCoinData(request, { params: { id: 'bitcoin' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(cachedData);
      expect(mockedApiClient.fetchCoinData).not.toHaveBeenCalled();
    });

    it('should handle different currencies', async () => {
      mockedApiClient.fetchCoinData.mockResolvedValue(mockCoinData);
      mockedApiClient.fetchPriceHistory.mockResolvedValue(mockPriceHistory);

      const request = createRequest('bitcoin', { currency: 'eur', days: '7' });
      const response = await getCoinData(request, { params: { id: 'bitcoin' } });

      expect(response.status).toBe(200);
      expect(mockedApiClient.fetchCoinData).toHaveBeenCalledWith('bitcoin', 'eur');
    });

    it('should handle candlestick chart type', async () => {
      mockedApiClient.fetchCoinData.mockResolvedValue(mockCoinData);
      mockedApiClient.fetchPriceHistory.mockResolvedValue(mockPriceHistory);
      mockedApiClient.fetchOHLC.mockResolvedValue(mockOHLCData);

      const request = createRequest('bitcoin', {
        currency: 'usd',
        days: '7',
        chartType: 'candlestick',
      });
      const response = await getCoinData(request, { params: { id: 'bitcoin' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('ohlcData');
      expect(mockedApiClient.fetchOHLC).toHaveBeenCalled();
    });

    it('should handle custom date ranges', async () => {
      const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const to = new Date();

      mockedApiClient.fetchCoinData.mockResolvedValue(mockCoinData);
      mockedApiClient.fetchPriceHistory.mockResolvedValue(mockPriceHistory);

      const request = createRequest('bitcoin', {
        currency: 'usd',
        from: from.toISOString(),
        to: to.toISOString(),
      });
      const response = await getCoinData(request, { params: { id: 'bitcoin' } });

      expect(response.status).toBe(200);
      expect(mockedApiClient.fetchPriceHistory).toHaveBeenCalledWith(
        'bitcoin',
        expect.objectContaining({
          from: expect.any(Date),
          to: expect.any(Date),
        })
      );
    });

    it('should return 400 for invalid coin ID', async () => {
      const request = createRequest('', { currency: 'usd', days: '7' });
      const response = await getCoinData(request, { params: { id: '' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid coin ID');
    });

    it('should return 400 for invalid date range', async () => {
      const to = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const from = new Date();

      const request = createRequest('bitcoin', {
        currency: 'usd',
        from: from.toISOString(),
        to: to.toISOString(),
      });
      const response = await getCoinData(request, { params: { id: 'bitcoin' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid date range');
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      (error as any).parsedError = {
        message: 'Failed to fetch coin data',
        statusCode: 500,
        retryable: true,
      };

      mockedApiClient.fetchCoinData.mockRejectedValue(error);

      const request = createRequest('bitcoin', { currency: 'usd', days: '7' });
      const response = await getCoinData(request, { params: { id: 'bitcoin' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('Failed to fetch coin data');
      expect(data).toHaveProperty('retryable');
    });

    it('should trigger background refresh when cache needs refresh', async () => {
      const cachedData = {
        coin: mockCoinData,
        priceHistory: mockPriceHistory,
        tokenomics: {},
      };

      mockCache.get.mockResolvedValue(cachedData);
      mockCache.needsRefresh.mockResolvedValue(true);
      mockedApiClient.fetchCoinData.mockResolvedValue(mockCoinData);
      mockedApiClient.fetchPriceHistory.mockResolvedValue(mockPriceHistory);

      const request = createRequest('bitcoin', { currency: 'usd', days: '7' });
      const response = await getCoinData(request, { params: { id: 'bitcoin' } });

      expect(response.status).toBe(200);
      // Background refresh should be triggered (fire and forget)
      // Wait a bit for the async operation
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockedApiClient.fetchCoinData).toHaveBeenCalled();
    });
  });

  describe('GET /api/coins/search', () => {
    const createRequest = (params?: { q?: string; limit?: string; ids?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.q) searchParams.set('q', params.q);
      if (params?.limit) searchParams.set('limit', params.limit);
      if (params?.ids) searchParams.set('ids', params.ids);

      const url = `http://localhost:3000/api/coins/search?${searchParams.toString()}`;
      return new NextRequest(url);
    };

    it('should search coins by query', async () => {
      mockedApiClient.searchCoins.mockResolvedValue([mockCoinData]);

      const request = createRequest({ q: 'bitcoin', limit: '10' });
      const response = await searchCoins(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(mockedApiClient.searchCoins).toHaveBeenCalledWith('bitcoin');
    });

    it('should fetch top coins when no query provided', async () => {
      mockedApiClient.fetchTopCoins.mockResolvedValue([mockCoinData]);

      const request = createRequest({ limit: '10' });
      const response = await searchCoins(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(mockedApiClient.fetchTopCoins).toHaveBeenCalledWith(10);
    });

    it('should fetch coins by IDs', async () => {
      mockedApiClient.fetchCoinsByIds.mockResolvedValue([mockCoinData]);

      const request = createRequest({ ids: 'bitcoin,ethereum' });
      const response = await searchCoins(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(mockedApiClient.fetchCoinsByIds).toHaveBeenCalledWith(
        expect.arrayContaining(['bitcoin', 'ethereum'])
      );
    });

    it('should return cached search results when available', async () => {
      const cachedResults = [mockCoinData];
      mockCache.get.mockResolvedValue(cachedResults);

      const request = createRequest({ q: 'bitcoin', limit: '10' });
      const response = await searchCoins(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(cachedResults);
      expect(mockedApiClient.searchCoins).not.toHaveBeenCalled();
    });

    it('should handle limit parameter', async () => {
      mockedApiClient.fetchTopCoins.mockResolvedValue([mockCoinData]);

      const request = createRequest({ limit: '5' });
      await searchCoins(request);

      expect(mockedApiClient.fetchTopCoins).toHaveBeenCalledWith(5);
    });

    it('should sanitize search query', async () => {
      mockedApiClient.searchCoins.mockResolvedValue([mockCoinData]);

      const request = createRequest({ q: 'bitcoin<script>', limit: '10' });
      await searchCoins(request);

      expect(mockedApiClient.searchCoins).toHaveBeenCalledWith(
        expect.not.stringContaining('<script>')
      );
    });

    it('should handle API errors', async () => {
      const error = new Error('Search failed');
      (error as any).parsedError = {
        message: 'Failed to search coins',
        statusCode: 500,
        retryable: false,
      };

      mockedApiClient.searchCoins.mockRejectedValue(error);

      const request = createRequest({ q: 'bitcoin', limit: '10' });
      const response = await searchCoins(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('Failed to search coins');
    });
  });

  describe('GET /api/exchange-rates', () => {
    const createRequest = (base?: string) => {
      const searchParams = new URLSearchParams();
      if (base) searchParams.set('base', base);

      const url = `http://localhost:3000/api/exchange-rates?${searchParams.toString()}`;
      return new NextRequest(url);
    };

    it('should fetch exchange rates successfully', async () => {
      mockedApiClient.fetchExchangeRates.mockResolvedValue(mockExchangeRates);

      const request = createRequest('usd');
      const response = await getExchangeRates(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('base');
      expect(data).toHaveProperty('rates');
      expect(data.base).toBe('usd');
      expect(mockedApiClient.fetchExchangeRates).toHaveBeenCalledWith('usd');
    });

    it('should use default currency when not provided', async () => {
      mockedApiClient.fetchExchangeRates.mockResolvedValue(mockExchangeRates);

      const request = createRequest();
      const response = await getExchangeRates(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toBeDefined();
    });

    it('should return cached exchange rates when available', async () => {
      mockCache.get.mockResolvedValue(mockExchangeRates);

      const request = createRequest('usd');
      const response = await getExchangeRates(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockExchangeRates);
      expect(mockedApiClient.fetchExchangeRates).not.toHaveBeenCalled();
    });

    it('should handle different base currencies', async () => {
      const eurRates = { ...mockExchangeRates, base: 'eur' };
      mockedApiClient.fetchExchangeRates.mockResolvedValue(eurRates);

      const request = createRequest('eur');
      const response = await getExchangeRates(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.base).toBe('eur');
      expect(mockedApiClient.fetchExchangeRates).toHaveBeenCalledWith('eur');
    });

    it('should trigger background refresh when cache needs refresh', async () => {
      mockCache.get.mockResolvedValue(mockExchangeRates);
      mockCache.needsRefresh.mockResolvedValue(true);
      mockedApiClient.fetchExchangeRates.mockResolvedValue(mockExchangeRates);

      const request = createRequest('usd');
      const response = await getExchangeRates(request);

      expect(response.status).toBe(200);
      // Wait for background refresh
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockedApiClient.fetchExchangeRates).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const error = new Error('Exchange rate API error');
      (error as any).parsedError = {
        message: 'Failed to fetch exchange rates',
        statusCode: 500,
        retryable: true,
      };

      mockedApiClient.fetchExchangeRates.mockRejectedValue(error);

      const request = createRequest('usd');
      const response = await getExchangeRates(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('Failed to fetch exchange rates');
      expect(data).toHaveProperty('retryable');
    });

    it('should sanitize currency parameter', async () => {
      mockedApiClient.fetchExchangeRates.mockResolvedValue(mockExchangeRates);

      const request = createRequest('USD<script>');
      await getExchangeRates(request);

      expect(mockedApiClient.fetchExchangeRates).toHaveBeenCalledWith(
        expect.not.stringContaining('<script>')
      );
    });
  });
});

