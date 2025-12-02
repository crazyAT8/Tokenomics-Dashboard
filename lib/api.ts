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

export const fetchCoinData = async (coinId: string, currency: string = 'usd'): Promise<CoinData> => {
  try {
    return await retry(async () => {
      // First fetch the coin data
      const coinResponse = await api.get(`/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: false,
        },
      });
      
      // Then fetch market data with the specified currency
      const marketResponse = await api.get('/coins/markets', {
        params: {
          vs_currency: currency,
          ids: coinId,
          order: 'market_cap_desc',
          per_page: 1,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h',
        },
      });
      
      // Merge the data, prioritizing market data for price-related fields
      const coinData = coinResponse.data;
      const marketData = marketResponse.data[0];
      
      if (marketData) {
        return {
          ...coinData,
          current_price: marketData.current_price,
          market_cap: marketData.market_cap,
          market_cap_rank: marketData.market_cap_rank,
          fully_diluted_valuation: marketData.fully_diluted_valuation,
          total_volume: marketData.total_volume,
          high_24h: marketData.high_24h,
          low_24h: marketData.low_24h,
          price_change_24h: marketData.price_change_24h,
          price_change_percentage_24h: marketData.price_change_percentage_24h,
          market_cap_change_24h: marketData.market_cap_change_24h,
          market_cap_change_percentage_24h: marketData.market_cap_change_percentage_24h,
          ath: marketData.ath,
          ath_change_percentage: marketData.ath_change_percentage,
          ath_date: marketData.ath_date,
          atl: marketData.atl,
          atl_change_percentage: marketData.atl_change_percentage,
          atl_date: marketData.atl_date,
          last_updated: marketData.last_updated,
        };
      }
      
      return coinData;
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
  options: {
    days?: number;
    from?: Date;
    to?: Date;
    currency?: string;
  } = {}
): Promise<PriceHistory[]> => {
  try {
    return await retry(async () => {
      const { days = 7, from, to, currency = 'usd' } = options;
      
      // Calculate days if we have custom date range
      let calculatedDays = days;
      if (from && to) {
        const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
        calculatedDays = daysDiff;
      }

      // CoinGecko API limits: max 365 days for free tier, can use 'max' for all available data
      // For custom ranges, we'll use the calculated days
      const params: any = {
        vs_currency: currency,
        days: calculatedDays > 365 ? 365 : calculatedDays, // Cap at 365 days
        interval: calculatedDays <= 1 ? 'hourly' : 'daily',
      };

      const response = await api.get(`/coins/${coinId}/market_chart`, {
        params,
      });
      
      // Filter the results to match the custom date range if provided
      let prices = response.data.prices.map(([timestamp, price]: [number, number]) => ({
        timestamp,
        price,
      }));

      // If custom date range is provided, filter the results
      if (from && to) {
        const fromTime = from.getTime();
        const toTime = to.getTime();
        prices = prices.filter((item: PriceHistory) => 
          item.timestamp >= fromTime && item.timestamp <= toTime
        );
      }
      
      return prices;
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
