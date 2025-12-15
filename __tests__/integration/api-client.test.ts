// Mock axios before importing the API module
// Create a factory function that returns a mock instance
function createMockAxiosInstance() {
  return {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn((onFulfilled, onRejected) => {
        return 0;
      }), eject: jest.fn() },
    },
  };
}

// Store the mock instance in a module-level variable
let mockAxiosInstance: ReturnType<typeof createMockAxiosInstance>;

jest.mock('axios', () => {
  const actualAxios = jest.requireActual('axios');
  // Create the mock instance
  const instance = createMockAxiosInstance();
  // Store it globally so tests can access it
  (global as any).__mockAxiosInstance__ = instance;
  
  return {
    ...actualAxios,
    default: {
      ...actualAxios.default,
      get: jest.fn(),
      create: jest.fn(() => instance),
    },
    create: jest.fn(() => instance),
  };
});

import axios from 'axios';
import {
  fetchCoinData,
  fetchPriceHistory,
  fetchOHLC,
  fetchTopCoins,
  fetchCoinsByIds,
  searchCoins,
  fetchExchangeRates,
} from '@/lib/api';
import {
  mockCoinGeckoCoinResponse,
  mockCoinGeckoMarketResponse,
  mockCoinGeckoMarketChartResponse,
  mockCoinGeckoOHLCResponse,
  mockCoinGeckoSearchResponse,
  mockExchangeRateApiResponse,
  mockCoinData,
  mockPriceHistory,
  mockOHLCData,
} from './helpers/mockData';

// Get the mock instance from global
mockAxiosInstance = (global as any).__mockAxiosInstance__;
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Client Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock instance
    mockAxiosInstance.get = jest.fn();
    // Also mock the default axios for exchange rates
    mockedAxios.get = jest.fn();
  });

  describe('fetchCoinData', () => {
    it('should fetch and return coin data successfully', async () => {
      mockAxiosInstance.get = jest.fn()
        .mockResolvedValueOnce({ data: mockCoinGeckoCoinResponse })
        .mockResolvedValueOnce({ data: mockCoinGeckoMarketResponse });

      const result = await fetchCoinData('bitcoin', 'usd');

      expect(result).toBeDefined();
      expect(result.id).toBe('bitcoin');
      expect(result.symbol).toBe('btc');
      expect(result.current_price).toBe(50000);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it('should handle different currencies', async () => {
      const eurMarketResponse = [{
        ...mockCoinGeckoMarketResponse[0],
        current_price: 42500, // EUR equivalent
      }];

      mockAxiosInstance.get = jest.fn()
        .mockResolvedValueOnce({ data: mockCoinGeckoCoinResponse })
        .mockResolvedValueOnce({ data: eurMarketResponse });

      const result = await fetchCoinData('bitcoin', 'eur');

      expect(result).toBeDefined();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('/coins/markets'),
        expect.objectContaining({
          params: expect.objectContaining({ vs_currency: 'eur' }),
        })
      );
    });

    it('should retry on network errors', async () => {
      const networkError = new Error('Network Error');
      (networkError as any).code = 'ECONNABORTED';

      mockAxiosInstance.get = jest.fn()
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({ data: mockCoinGeckoCoinResponse })
        .mockResolvedValueOnce({ data: mockCoinGeckoMarketResponse });

      const result = await fetchCoinData('bitcoin', 'usd');

      expect(result).toBeDefined();
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(4); // 2 retries + 2 successful calls
    });

    it('should throw error for invalid coin ID', async () => {
      await expect(fetchCoinData('', 'usd')).rejects.toThrow('Invalid coin ID');
    });

    it('should handle API errors gracefully', async () => {
      const apiError = {
        response: {
          status: 404,
          data: { error: 'Coin not found' },
        },
      };

      mockAxiosInstance.get = jest.fn().mockRejectedValue(apiError);

      await expect(fetchCoinData('invalid-coin', 'usd')).rejects.toThrow();
    });
  });

  describe('fetchPriceHistory', () => {
    it('should fetch price history successfully', async () => {
      mockAxiosInstance.get = jest.fn().mockResolvedValue({
        data: mockCoinGeckoMarketChartResponse,
      });

      const result = await fetchPriceHistory('bitcoin', { days: 7, currency: 'usd' });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('timestamp');
      expect(result[0]).toHaveProperty('price');
    });

    it('should handle custom date ranges', async () => {
      const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const to = new Date();

      mockAxiosInstance.get = jest.fn().mockResolvedValue({
        data: mockCoinGeckoMarketChartResponse,
      });

      const result = await fetchPriceHistory('bitcoin', {
        from,
        to,
        currency: 'usd',
      });

      expect(result).toBeDefined();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('/market_chart'),
        expect.objectContaining({
          params: expect.objectContaining({ vs_currency: 'usd' }),
        })
      );
    });

    it('should filter price history by custom date range', async () => {
      const from = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const to = new Date();

      mockAxiosInstance.get = jest.fn().mockResolvedValue({
        data: mockCoinGeckoMarketChartResponse,
      });

      const result = await fetchPriceHistory('bitcoin', {
        from,
        to,
        currency: 'usd',
      });

      expect(result).toBeDefined();
      // All results should be within the date range
      result.forEach((item) => {
        expect(item.timestamp).toBeGreaterThanOrEqual(from.getTime());
        expect(item.timestamp).toBeLessThanOrEqual(to.getTime());
      });
    });

    it('should handle errors when fetching price history', async () => {
      const apiError = {
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        },
      };

      mockAxiosInstance.get = jest.fn().mockRejectedValue(apiError);

      await expect(
        fetchPriceHistory('bitcoin', { days: 7, currency: 'usd' })
      ).rejects.toThrow();
    });
  });

  describe('fetchOHLC', () => {
    it('should fetch OHLC data successfully', async () => {
      mockAxiosInstance.get = jest.fn()
        .mockResolvedValueOnce({ data: mockCoinGeckoOHLCResponse })
        .mockResolvedValueOnce({ data: mockCoinGeckoMarketChartResponse });

      const result = await fetchOHLC('bitcoin', { days: 7, currency: 'usd' });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('timestamp');
      expect(result[0]).toHaveProperty('open');
      expect(result[0]).toHaveProperty('high');
      expect(result[0]).toHaveProperty('low');
      expect(result[0]).toHaveProperty('close');
    });

    it('should merge volume data from market chart', async () => {
      mockAxiosInstance.get = jest.fn()
        .mockResolvedValueOnce({ data: mockCoinGeckoOHLCResponse })
        .mockResolvedValueOnce({ data: mockCoinGeckoMarketChartResponse });

      const result = await fetchOHLC('bitcoin', { days: 7, currency: 'usd' });

      expect(result).toBeDefined();
      // Check if volume is included when available
      const hasVolume = result.some((item) => 'volume' in item);
      expect(hasVolume).toBe(true);
    });

    it('should select closest supported days value', async () => {
      mockAxiosInstance.get = jest.fn()
        .mockResolvedValueOnce({ data: mockCoinGeckoOHLCResponse })
        .mockResolvedValueOnce({ data: mockCoinGeckoMarketChartResponse });

      await fetchOHLC('bitcoin', { days: 15, currency: 'usd' });

      // Should use 14 days (closest supported value)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('/ohlc'),
        expect.objectContaining({
          params: expect.objectContaining({ days: 14 }),
        })
      );
    });
  });

  describe('fetchTopCoins', () => {
    it('should fetch top coins successfully', async () => {
      mockAxiosInstance.get = jest.fn().mockResolvedValue({
        data: mockCoinGeckoMarketResponse,
      });

      const result = await fetchTopCoins(10);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('/coins/markets'),
        expect.objectContaining({
          params: expect.objectContaining({ per_page: 10 }),
        })
      );
    });

    it('should respect limit parameter', async () => {
      mockAxiosInstance.get = jest.fn().mockResolvedValue({
        data: mockCoinGeckoMarketResponse.slice(0, 5),
      });

      const result = await fetchTopCoins(5);

      expect(result).toBeDefined();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('/coins/markets'),
        expect.objectContaining({
          params: expect.objectContaining({ per_page: 5 }),
        })
      );
    });
  });

  describe('fetchCoinsByIds', () => {
    it('should fetch coins by IDs successfully', async () => {
      mockAxiosInstance.get = jest.fn().mockResolvedValue({
        data: mockCoinGeckoMarketResponse,
      });

      const result = await fetchCoinsByIds(['bitcoin', 'ethereum']);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('/coins/markets'),
        expect.objectContaining({
          params: expect.objectContaining({
            ids: 'bitcoin,ethereum',
          }),
        })
      );
    });

    it('should return empty array for empty IDs', async () => {
      const result = await fetchCoinsByIds([]);
      expect(result).toEqual([]);
      expect(mockAxiosInstance.get).not.toHaveBeenCalled();
    });

    it('should sanitize and filter invalid IDs', async () => {
      mockAxiosInstance.get = jest.fn().mockResolvedValue({
        data: mockCoinGeckoMarketResponse,
      });

      await fetchCoinsByIds(['bitcoin', '', 'invalid<script>', 'ethereum']);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('/coins/markets'),
        expect.objectContaining({
          params: expect.objectContaining({
            ids: expect.stringContaining('bitcoin'),
          }),
        })
      );
    });
  });

  describe('searchCoins', () => {
    it('should search coins successfully', async () => {
      mockAxiosInstance.get = jest.fn().mockResolvedValue({
        data: mockCoinGeckoSearchResponse,
      });

      const result = await searchCoins('bitcoin');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('/search'),
        expect.objectContaining({
          params: expect.objectContaining({ query: 'bitcoin' }),
        })
      );
    });

    it('should return empty array for empty query', async () => {
      const result = await searchCoins('');
      expect(result).toEqual([]);
      expect(mockAxiosInstance.get).not.toHaveBeenCalled();
    });

    it('should sanitize search query', async () => {
      mockAxiosInstance.get = jest.fn().mockResolvedValue({
        data: mockCoinGeckoSearchResponse,
      });

      await searchCoins('bitcoin<script>');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('/search'),
        expect.objectContaining({
          params: expect.objectContaining({
            query: expect.not.stringContaining('<script>'),
          }),
        })
      );
    });
  });

  describe('fetchExchangeRates', () => {
    it('should fetch exchange rates successfully', async () => {
      mockedAxios.get = jest.fn().mockResolvedValue({
        data: mockExchangeRateApiResponse,
      });

      const result = await fetchExchangeRates('usd');

      expect(result).toBeDefined();
      expect(result.base).toBe('usd');
      expect(result.rates).toBeDefined();
      expect(typeof result.rates.eur).toBe('number');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('api.exchangerate-api.com'),
        expect.any(Object)
      );
    });

    it('should handle different base currencies', async () => {
      const eurResponse = {
        ...mockExchangeRateApiResponse,
        base: 'EUR',
        rates: {
          USD: 1.18,
          GBP: 0.86,
        },
      };

      mockedAxios.get = jest.fn().mockResolvedValue({
        data: eurResponse,
      });

      const result = await fetchExchangeRates('eur');

      expect(result.base).toBe('eur');
      expect(result.rates).toBeDefined();
    });

    it('should retry on network errors', async () => {
      const networkError = new Error('Network Error');
      (networkError as any).code = 'ECONNABORTED';

      mockedAxios.get = jest.fn()
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({ data: mockExchangeRateApiResponse });

      const result = await fetchExchangeRates('usd');

      expect(result).toBeDefined();
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should handle API errors', async () => {
      const apiError = {
        response: {
          status: 404,
          data: { error: 'Currency not found' },
        },
      };

      mockedAxios.get = jest.fn().mockRejectedValue(apiError);

      await expect(fetchExchangeRates('invalid')).rejects.toThrow();
    });
  });

  describe('Error Handling and Retries', () => {
    it('should handle rate limit errors', async () => {
      const rateLimitError = {
        response: {
          status: 429,
          data: { error: 'Rate limit exceeded' },
        },
      };

      mockAxiosInstance.get = jest.fn()
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({ data: mockCoinGeckoCoinResponse })
        .mockResolvedValueOnce({ data: mockCoinGeckoMarketResponse });

      const result = await fetchCoinData('bitcoin', 'usd');

      expect(result).toBeDefined();
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(3);
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('timeout of 10000ms exceeded');
      (timeoutError as any).code = 'ECONNABORTED';

      mockAxiosInstance.get = jest.fn()
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce({ data: mockCoinGeckoCoinResponse })
        .mockResolvedValueOnce({ data: mockCoinGeckoMarketResponse });

      const result = await fetchCoinData('bitcoin', 'usd');

      expect(result).toBeDefined();
    });

    it('should handle server errors (5xx)', async () => {
      const serverError = {
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        },
      };

      mockAxiosInstance.get = jest.fn()
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce({ data: mockCoinGeckoCoinResponse })
        .mockResolvedValueOnce({ data: mockCoinGeckoMarketResponse });

      const result = await fetchCoinData('bitcoin', 'usd');

      expect(result).toBeDefined();
    });
  });
});
