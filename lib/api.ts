import axios, { AxiosError } from 'axios';
import { CoinData, PriceHistory } from './types';
import { retry } from './utils/retry';
import { parseError, getUserFriendlyErrorMessage } from './utils/errorHandler';

const COINGECKO_API_URL = process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;

const api = axios.create({
  baseURL: COINGECKO_API_URL,
  timeout: 10000,
  headers: COINGECKO_API_KEY ? {
    'x-cg-pro-api-key': COINGECKO_API_KEY
  } : {},
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const parsedError = parseError(error);
    // Enhance error object with parsed information
    (error as any).parsedError = parsedError;
    return Promise.reject(error);
  }
);

export const fetchCoinData = async (coinId: string): Promise<CoinData> => {
  try {
    return await retry(async () => {
      const response = await api.get(`/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: false,
        },
      });
      return response.data;
    }, {
      maxRetries: 3,
      initialDelay: 1000,
    });
  } catch (error: any) {
    console.error('Error fetching coin data:', error);
    const parsedError = error.parsedError || parseError(error);
    const message = getUserFriendlyErrorMessage(parsedError);
    const enhancedError = new Error(message);
    (enhancedError as any).parsedError = parsedError;
    throw enhancedError;
  }
};

export const fetchPriceHistory = async (
  coinId: string,
  days: number = 7
): Promise<PriceHistory[]> => {
  try {
    return await retry(async () => {
      const response = await api.get(`/coins/${coinId}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days,
          interval: days <= 1 ? 'hourly' : 'daily',
        },
      });
      
      return response.data.prices.map(([timestamp, price]: [number, number]) => ({
        timestamp,
        price,
      }));
    }, {
      maxRetries: 3,
      initialDelay: 1000,
    });
  } catch (error: any) {
    console.error('Error fetching price history:', error);
    const parsedError = error.parsedError || parseError(error);
    const message = getUserFriendlyErrorMessage(parsedError);
    const enhancedError = new Error(message);
    (enhancedError as any).parsedError = parsedError;
    throw enhancedError;
  }
};

export const fetchTopCoins = async (limit: number = 10): Promise<CoinData[]> => {
  try {
    return await retry(async () => {
      const response = await api.get('/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: limit,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h',
        },
      });
      return response.data;
    }, {
      maxRetries: 3,
      initialDelay: 1000,
    });
  } catch (error: any) {
    console.error('Error fetching top coins:', error);
    const parsedError = error.parsedError || parseError(error);
    const message = getUserFriendlyErrorMessage(parsedError);
    const enhancedError = new Error(message);
    (enhancedError as any).parsedError = parsedError;
    throw enhancedError;
  }
};

export const searchCoins = async (query: string): Promise<CoinData[]> => {
  try {
    return await retry(async () => {
      const response = await api.get('/search', {
        params: {
          query,
        },
      });
      return response.data.coins.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        image: coin.thumb,
        current_price: 0,
        market_cap: 0,
        market_cap_rank: coin.market_cap_rank || 0,
        fully_diluted_valuation: 0,
        total_volume: 0,
        high_24h: 0,
        low_24h: 0,
        price_change_24h: 0,
        price_change_percentage_24h: 0,
        market_cap_change_24h: 0,
        market_cap_change_percentage_24h: 0,
        circulating_supply: 0,
        total_supply: 0,
        max_supply: 0,
        ath: 0,
        ath_change_percentage: 0,
        ath_date: '',
        atl: 0,
        atl_change_percentage: 0,
        atl_date: '',
        last_updated: '',
      }));
    }, {
      maxRetries: 2, // Fewer retries for search to avoid delays
      initialDelay: 500,
    });
  } catch (error: any) {
    console.error('Error searching coins:', error);
    const parsedError = error.parsedError || parseError(error);
    const message = getUserFriendlyErrorMessage(parsedError);
    const enhancedError = new Error(message);
    (enhancedError as any).parsedError = parsedError;
    throw enhancedError;
  }
};
