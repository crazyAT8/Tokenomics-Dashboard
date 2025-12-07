import axios, { AxiosError } from 'axios';
import { CoinData, PriceHistory, OHLCData, ExchangeRates } from './types';
import { retry } from './utils/retry';
import { parseError, getUserFriendlyErrorMessage } from './utils/errorHandler';
import {
  validateCoinData,
  validatePriceHistory,
  validateOHLCData,
  validateExchangeRates,
  validateCoinGeckoCoinResponse,
  validateCoinGeckoMarketResponse,
  validateCoinGeckoMarketChartResponse,
  validateCoinGeckoOHLCResponse,
  validateCoinGeckoSearchResponse,
  validateExchangeRateApiResponse,
  ValidationError,
} from './validation/validators';
import { sanitizeCoinId, sanitizeCurrency, sanitizeSearchQuery } from './utils/sanitize';

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
    // Sanitize inputs
    const sanitizedCoinId = sanitizeCoinId(coinId);
    const sanitizedCurrency = sanitizeCurrency(currency);
    
    if (!sanitizedCoinId) {
      throw new Error('Invalid coin ID');
    }
    
    return await retry(async () => {
      // First fetch the coin data
      const coinResponse = await api.get(`/coins/${sanitizedCoinId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: false,
        },
      });
      
      // Validate raw API response
      validateCoinGeckoCoinResponse(coinResponse.data);
      
      // Then fetch market data with the specified currency
      const marketResponse = await api.get('/coins/markets', {
        params: {
          vs_currency: sanitizedCurrency,
          ids: sanitizedCoinId,
          order: 'market_cap_desc',
          per_page: 1,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h',
        },
      });
      
      // Validate raw market API response
      const validatedMarketResponse = validateCoinGeckoMarketResponse(marketResponse.data);
      
      // Merge the data, prioritizing market data for price-related fields
      const coinData = coinResponse.data;
      const marketData = validatedMarketResponse[0];
      
      let mergedData: CoinData;
      
      if (marketData) {
        // Extract image from coinData (could be in image object or direct string)
        const image = coinData.image?.large || coinData.image?.small || coinData.image?.thumb || coinData.image || '';
        
        mergedData = {
          id: coinData.id,
          symbol: coinData.symbol,
          name: coinData.name,
          image: typeof image === 'string' ? image : '',
          current_price: marketData.current_price ?? 0,
          market_cap: marketData.market_cap ?? 0,
          market_cap_rank: marketData.market_cap_rank ?? 0,
          fully_diluted_valuation: marketData.fully_diluted_valuation ?? null,
          total_volume: marketData.total_volume ?? 0,
          high_24h: marketData.high_24h ?? null,
          low_24h: marketData.low_24h ?? null,
          price_change_24h: marketData.price_change_24h ?? null,
          price_change_percentage_24h: marketData.price_change_percentage_24h ?? null,
          market_cap_change_24h: marketData.market_cap_change_24h ?? null,
          market_cap_change_percentage_24h: marketData.market_cap_change_percentage_24h ?? null,
          circulating_supply: marketData.circulating_supply ?? coinData.market_data?.circulating_supply ?? null,
          total_supply: marketData.total_supply ?? coinData.market_data?.total_supply ?? null,
          max_supply: marketData.max_supply ?? coinData.market_data?.max_supply ?? null,
          ath: marketData.ath ?? null,
          ath_change_percentage: marketData.ath_change_percentage ?? null,
          ath_date: marketData.ath_date ?? '',
          atl: marketData.atl ?? null,
          atl_change_percentage: marketData.atl_change_percentage ?? null,
          atl_date: marketData.atl_date ?? '',
          last_updated: marketData.last_updated ?? coinData.market_data?.last_updated ?? new Date().toISOString(),
        };
      } else {
        // Fallback to coinData only
        const marketDataFromCoin = coinData.market_data;
        const image = coinData.image?.large || coinData.image?.small || coinData.image?.thumb || coinData.image || '';
        
        mergedData = {
          id: coinData.id,
          symbol: coinData.symbol,
          name: coinData.name,
          image: typeof image === 'string' ? image : '',
          current_price: marketDataFromCoin?.current_price?.[sanitizedCurrency] ?? 0,
          market_cap: marketDataFromCoin?.market_cap?.[sanitizedCurrency] ?? 0,
          market_cap_rank: marketDataFromCoin?.market_cap_rank ?? 0,
          fully_diluted_valuation: marketDataFromCoin?.fully_diluted_valuation?.[sanitizedCurrency] ?? null,
          total_volume: marketDataFromCoin?.total_volume?.[sanitizedCurrency] ?? 0,
          high_24h: marketDataFromCoin?.high_24h?.[sanitizedCurrency] ?? null,
          low_24h: marketDataFromCoin?.low_24h?.[sanitizedCurrency] ?? null,
          price_change_24h: marketDataFromCoin?.price_change_24h ?? null,
          price_change_percentage_24h: marketDataFromCoin?.price_change_percentage_24h ?? null,
          market_cap_change_24h: marketDataFromCoin?.market_cap_change_24h ?? null,
          market_cap_change_percentage_24h: marketDataFromCoin?.market_cap_change_percentage_24h ?? null,
          circulating_supply: marketDataFromCoin?.circulating_supply ?? null,
          total_supply: marketDataFromCoin?.total_supply ?? null,
          max_supply: marketDataFromCoin?.max_supply ?? null,
          ath: marketDataFromCoin?.ath?.[sanitizedCurrency] ?? null,
          ath_change_percentage: marketDataFromCoin?.ath_change_percentage?.[sanitizedCurrency] ?? null,
          ath_date: marketDataFromCoin?.ath_date?.[sanitizedCurrency] ?? '',
          atl: marketDataFromCoin?.atl?.[sanitizedCurrency] ?? null,
          atl_change_percentage: marketDataFromCoin?.atl_change_percentage?.[sanitizedCurrency] ?? null,
          atl_date: marketDataFromCoin?.atl_date?.[sanitizedCurrency] ?? '',
          last_updated: marketDataFromCoin?.last_updated ?? new Date().toISOString(),
        };
      }
      
      // Validate the final merged data
      return validateCoinData(mergedData);
    }, {
      maxRetries: 3,
      initialDelay: 1000,
    });
  } catch (error: any) {
    console.error('Error fetching coin data:', error);
    
    // Handle validation errors
    if (error instanceof ValidationError) {
      const validationError = new Error(`Data validation failed: ${error.message}`);
      (validationError as any).parsedError = {
        message: error.message,
        statusCode: 500,
        retryable: false,
        type: 'validation_error',
      };
      throw validationError;
    }
    
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
    // Sanitize inputs
    const sanitizedCoinId = sanitizeCoinId(coinId);
    const sanitizedCurrency = sanitizeCurrency(options.currency);
    
    if (!sanitizedCoinId) {
      throw new Error('Invalid coin ID');
    }
    
    return await retry(async () => {
      const { days = 7, from, to } = options;
      
      // Calculate days if we have custom date range
      let calculatedDays = days;
      if (from && to) {
        const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
        calculatedDays = daysDiff;
      }

      // CoinGecko API limits: max 365 days for free tier, can use 'max' for all available data
      // For custom ranges, we'll use the calculated days
      const params: any = {
        vs_currency: sanitizedCurrency,
        days: calculatedDays > 365 ? 365 : calculatedDays, // Cap at 365 days
        interval: calculatedDays <= 1 ? 'hourly' : 'daily',
      };

      const response = await api.get(`/coins/${sanitizedCoinId}/market_chart`, {
        params,
      });
      
      // Validate raw API response
      const validatedResponse = validateCoinGeckoMarketChartResponse(response.data);
      
      // Filter the results to match the custom date range if provided
      let prices = validatedResponse.prices
        .filter(([timestamp, price]) => timestamp && price && price > 0)
        .map(([timestamp, price]) => ({
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
      
      // Validate the final price history array
      return validatePriceHistory(prices);
    }, {
      maxRetries: 3,
      initialDelay: 1000,
    });
  } catch (error: any) {
    console.error('Error fetching price history:', error);
    
    // Handle validation errors
    if (error instanceof ValidationError) {
      const validationError = new Error(`Data validation failed: ${error.message}`);
      (validationError as any).parsedError = {
        message: error.message,
        statusCode: 500,
        retryable: false,
        type: 'validation_error',
      };
      throw validationError;
    }
    
    const parsedError = error.parsedError || parseError(error);
    const message = getUserFriendlyErrorMessage(parsedError);
    const enhancedError = new Error(message);
    (enhancedError as any).parsedError = parsedError;
    throw enhancedError;
  }
};

export const fetchOHLC = async (
  coinId: string,
  options: {
    days?: number;
    currency?: string;
  } = {}
): Promise<OHLCData[]> => {
  try {
    // Sanitize inputs
    const sanitizedCoinId = sanitizeCoinId(coinId);
    const sanitizedCurrency = sanitizeCurrency(options.currency);
    
    if (!sanitizedCoinId) {
      throw new Error('Invalid coin ID');
    }
    
    return await retry(async () => {
      const { days = 7 } = options;
      
      // CoinGecko OHLC endpoint supports: 1, 7, 14, 30, 90, 180, 365 days
      // We'll use the closest supported value
      const supportedDays = [1, 7, 14, 30, 90, 180, 365];
      const selectedDays = supportedDays.reduce((prev, curr) => 
        Math.abs(curr - days) < Math.abs(prev - days) ? curr : prev
      );

      // Fetch both OHLC and market chart data (for volume)
      const [ohlcResponse, marketChartResponse] = await Promise.all([
        api.get(`/coins/${sanitizedCoinId}/ohlc`, {
          params: {
            vs_currency: sanitizedCurrency,
            days: selectedDays,
          },
        }),
        api.get(`/coins/${sanitizedCoinId}/market_chart`, {
          params: {
            vs_currency: sanitizedCurrency,
            days: selectedDays,
            interval: selectedDays <= 1 ? 'hourly' : 'daily',
          },
        }),
      ]);
      
      // Validate raw API responses
      const validatedOHLC = validateCoinGeckoOHLCResponse(ohlcResponse.data);
      const validatedMarketChart = validateCoinGeckoMarketChartResponse(marketChartResponse.data);
      
      // Create a map of volume data by timestamp for quick lookup
      const volumeMap = new Map<number, number>();
      if (validatedMarketChart.total_volumes) {
        validatedMarketChart.total_volumes.forEach(([timestamp, volume]) => {
          if (timestamp && volume && volume > 0) {
            volumeMap.set(timestamp, volume);
          }
        });
      }
      
      // Transform OHLC data and merge with volume: [timestamp, open, high, low, close]
      const ohlcData = validatedOHLC
        .filter(([timestamp, open, high, low, close]) => 
          timestamp && open > 0 && high > 0 && low > 0 && close > 0
        )
        .map(([timestamp, open, high, low, close]) => {
          // Find closest volume timestamp (within 1 hour tolerance)
          let volume: number | undefined;
          const exactVolume = volumeMap.get(timestamp);
          if (exactVolume) {
            volume = exactVolume;
          } else {
            // Find closest timestamp within 1 hour
            const tolerance = 60 * 60 * 1000; // 1 hour in milliseconds
            const volumeEntries = Array.from(volumeMap.entries());
            for (const [volTimestamp, vol] of volumeEntries) {
              if (Math.abs(volTimestamp - timestamp) <= tolerance) {
                volume = vol;
                break;
              }
            }
          }
          
          return {
            timestamp,
            open,
            high,
            low,
            close,
            ...(volume !== undefined && { volume }),
          };
        });
      
      // Validate the final OHLC array
      return validateOHLCData(ohlcData);
    }, {
      maxRetries: 3,
      initialDelay: 1000,
    });
  } catch (error: any) {
    console.error('Error fetching OHLC data:', error);
    
    // Handle validation errors
    if (error instanceof ValidationError) {
      const validationError = new Error(`Data validation failed: ${error.message}`);
      (validationError as any).parsedError = {
        message: error.message,
        statusCode: 500,
        retryable: false,
        type: 'validation_error',
      };
      throw validationError;
    }
    
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
      
      // Validate raw API response
      const validatedResponse = validateCoinGeckoMarketResponse(response.data);
      
      // Transform and validate each coin
      const coins = validatedResponse.map((marketData) => {
        const coinData: CoinData = {
          id: marketData.id,
          symbol: marketData.symbol,
          name: marketData.name,
          image: marketData.image || '',
          current_price: marketData.current_price ?? 0,
          market_cap: marketData.market_cap ?? 0,
          market_cap_rank: marketData.market_cap_rank ?? 0,
          fully_diluted_valuation: marketData.fully_diluted_valuation ?? null,
          total_volume: marketData.total_volume ?? 0,
          high_24h: marketData.high_24h ?? null,
          low_24h: marketData.low_24h ?? null,
          price_change_24h: marketData.price_change_24h ?? null,
          price_change_percentage_24h: marketData.price_change_percentage_24h ?? null,
          market_cap_change_24h: marketData.market_cap_change_24h ?? null,
          market_cap_change_percentage_24h: marketData.market_cap_change_percentage_24h ?? null,
          circulating_supply: marketData.circulating_supply ?? null,
          total_supply: marketData.total_supply ?? null,
          max_supply: marketData.max_supply ?? null,
          ath: marketData.ath ?? null,
          ath_change_percentage: marketData.ath_change_percentage ?? null,
          ath_date: marketData.ath_date ?? '',
          atl: marketData.atl ?? null,
          atl_change_percentage: marketData.atl_change_percentage ?? null,
          atl_date: marketData.atl_date ?? '',
          last_updated: marketData.last_updated ?? new Date().toISOString(),
        };
        
        return validateCoinData(coinData);
      });
      
      return coins;
    }, {
      maxRetries: 3,
      initialDelay: 1000,
    });
  } catch (error: any) {
    console.error('Error fetching top coins:', error);
    
    // Handle validation errors
    if (error instanceof ValidationError) {
      const validationError = new Error(`Data validation failed: ${error.message}`);
      (validationError as any).parsedError = {
        message: error.message,
        statusCode: 500,
        retryable: false,
        type: 'validation_error',
      };
      throw validationError;
    }
    
    const parsedError = error.parsedError || parseError(error);
    const message = getUserFriendlyErrorMessage(parsedError);
    const enhancedError = new Error(message);
    (enhancedError as any).parsedError = parsedError;
    throw enhancedError;
  }
};

export const fetchCoinsByIds = async (ids: string[]): Promise<CoinData[]> => {
  try {
    if (!ids || ids.length === 0) {
      return [];
    }

    // Sanitize coin IDs
    const sanitizedIds = ids.map(id => sanitizeCoinId(id)).filter(Boolean) as string[];
    
    if (sanitizedIds.length === 0) {
      return [];
    }

    return await retry(async () => {
      const response = await api.get('/coins/markets', {
        params: {
          vs_currency: 'usd',
          ids: sanitizedIds.join(','),
          order: 'market_cap_desc',
          per_page: sanitizedIds.length,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h',
        },
      });
      
      // Validate raw API response
      const validatedResponse = validateCoinGeckoMarketResponse(response.data);
      
      // Transform and validate each coin
      const coins = validatedResponse.map((marketData) => {
        const coinData: CoinData = {
          id: marketData.id,
          symbol: marketData.symbol,
          name: marketData.name,
          image: marketData.image || '',
          current_price: marketData.current_price ?? 0,
          market_cap: marketData.market_cap ?? 0,
          market_cap_rank: marketData.market_cap_rank ?? 0,
          fully_diluted_valuation: marketData.fully_diluted_valuation ?? null,
          total_volume: marketData.total_volume ?? 0,
          high_24h: marketData.high_24h ?? null,
          low_24h: marketData.low_24h ?? null,
          price_change_24h: marketData.price_change_24h ?? null,
          price_change_percentage_24h: marketData.price_change_percentage_24h ?? null,
          market_cap_change_24h: marketData.market_cap_change_24h ?? null,
          market_cap_change_percentage_24h: marketData.market_cap_change_percentage_24h ?? null,
          circulating_supply: marketData.circulating_supply ?? null,
          total_supply: marketData.total_supply ?? null,
          max_supply: marketData.max_supply ?? null,
          ath: marketData.ath ?? null,
          ath_change_percentage: marketData.ath_change_percentage ?? null,
          ath_date: marketData.ath_date ?? '',
          atl: marketData.atl ?? null,
          atl_change_percentage: marketData.atl_change_percentage ?? null,
          atl_date: marketData.atl_date ?? '',
          last_updated: marketData.last_updated ?? new Date().toISOString(),
        };
        
        return validateCoinData(coinData);
      });
      
      return coins;
    }, {
      maxRetries: 3,
      initialDelay: 1000,
    });
  } catch (error: any) {
    console.error('Error fetching coins by IDs:', error);
    
    // Handle validation errors
    if (error instanceof ValidationError) {
      const validationError = new Error(`Data validation failed: ${error.message}`);
      (validationError as any).parsedError = {
        message: error.message,
        statusCode: 500,
        retryable: false,
        type: 'validation_error',
      };
      throw validationError;
    }
    
    const parsedError = error.parsedError || parseError(error);
    const message = getUserFriendlyErrorMessage(parsedError);
    const enhancedError = new Error(message);
    (enhancedError as any).parsedError = parsedError;
    throw enhancedError;
  }
};

export const searchCoins = async (query: string): Promise<CoinData[]> => {
  try {
    // Sanitize search query
    const sanitizedQuery = sanitizeSearchQuery(query);
    
    if (!sanitizedQuery) {
      return [];
    }
    
    return await retry(async () => {
      const response = await api.get('/search', {
        params: {
          query: sanitizedQuery,
        },
      });
      
      // Validate raw API response
      const validatedResponse = validateCoinGeckoSearchResponse(response.data);
      
      // Transform and validate each coin
      const coins = validatedResponse.coins.map((coin) => {
        const coinData: CoinData = {
          id: coin.id,
          symbol: coin.symbol,
          name: coin.name,
          image: coin.thumb || '',
          current_price: 0,
          market_cap: 0,
          market_cap_rank: coin.market_cap_rank ?? 0,
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
        };
        
        return validateCoinData(coinData);
      });
      
      return coins;
    }, {
      maxRetries: 2, // Fewer retries for search to avoid delays
      initialDelay: 500,
    });
  } catch (error: any) {
    console.error('Error searching coins:', error);
    
    // Handle validation errors
    if (error instanceof ValidationError) {
      const validationError = new Error(`Data validation failed: ${error.message}`);
      (validationError as any).parsedError = {
        message: error.message,
        statusCode: 500,
        retryable: false,
        type: 'validation_error',
      };
      throw validationError;
    }
    
    const parsedError = error.parsedError || parseError(error);
    const message = getUserFriendlyErrorMessage(parsedError);
    const enhancedError = new Error(message);
    (enhancedError as any).parsedError = parsedError;
    throw enhancedError;
  }
};

export const fetchExchangeRates = async (baseCurrency: string = 'usd'): Promise<ExchangeRates> => {
  try {
    // Sanitize base currency
    const sanitizedBaseCurrency = sanitizeCurrency(baseCurrency);
    
    return await retry(async () => {
      // Use exchangerate-api.com free tier (no API key required)
      // Convert currency code to uppercase for the API
      const base = sanitizedBaseCurrency.toUpperCase();
      const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${base}`, {
        timeout: 5000,
      });
      
      // Validate raw API response
      const validatedResponse = validateExchangeRateApiResponse(response.data);
      
      // Transform to our ExchangeRates format
      const exchangeRates: ExchangeRates = {
        base: sanitizedBaseCurrency,
        rates: validatedResponse.rates,
        timestamp: validatedResponse.timestamp ?? Date.now(),
      };
      
      // Validate the final exchange rates
      return validateExchangeRates(exchangeRates);
    }, {
      maxRetries: 2,
      initialDelay: 500,
    });
  } catch (error: any) {
    console.error('Error fetching exchange rates:', error);
    
    // Handle validation errors
    if (error instanceof ValidationError) {
      const validationError = new Error(`Data validation failed: ${error.message}`);
      (validationError as any).parsedError = {
        message: error.message,
        statusCode: 500,
        retryable: false,
        type: 'validation_error',
      };
      throw validationError;
    }
    
    const parsedError = error.parsedError || parseError(error);
    const message = getUserFriendlyErrorMessage(parsedError);
    const enhancedError = new Error(message);
    (enhancedError as any).parsedError = parsedError;
    throw enhancedError;
  }
};
