/**
 * Fallback data utilities
 * Provides default values for missing fields in API responses
 */

import { CoinData, PriceHistory, TokenomicsData, MarketData, ExchangeRates } from '../types';

/**
 * Default fallback values for CoinData
 */
export const CoinDataFallbacks: Partial<CoinData> = {
  image: '',
  current_price: 0,
  market_cap: 0,
  market_cap_rank: 0,
  fully_diluted_valuation: null,
  total_volume: 0,
  high_24h: null,
  low_24h: null,
  price_change_24h: null,
  price_change_percentage_24h: null,
  market_cap_change_24h: null,
  market_cap_change_percentage_24h: null,
  circulating_supply: null,
  total_supply: null,
  max_supply: null,
  ath: null,
  ath_change_percentage: null,
  ath_date: '',
  atl: null,
  atl_change_percentage: null,
  atl_date: '',
  last_updated: new Date().toISOString(),
};

/**
 * Default fallback values for TokenomicsData
 */
export const TokenomicsDataFallbacks: Partial<TokenomicsData> = {
  circulating_supply: null,
  total_supply: null,
  max_supply: null,
  market_cap: 0,
  fully_diluted_valuation: null,
  price: 0,
  price_change_24h: null,
  price_change_percentage_24h: null,
  volume_24h: 0,
  market_cap_rank: 0,
};

/**
 * Default fallback values for PriceHistory
 */
export const PriceHistoryFallbacks: Partial<PriceHistory> = {
  timestamp: Date.now(),
  price: 0,
};

/**
 * Default fallback values for ExchangeRates
 */
export const ExchangeRatesFallbacks: Partial<ExchangeRates> = {
  base: 'usd',
  rates: {},
  timestamp: Date.now(),
};

/**
 * Applies fallback values to an object, only setting values that are missing or null/undefined
 */
export function applyFallbacks<T extends Record<string, any>>(
  data: Partial<T>,
  fallbacks: Partial<T>
): T {
  const result = { ...data } as T;
  
  for (const key in fallbacks) {
    if (Object.prototype.hasOwnProperty.call(fallbacks, key)) {
      // Only apply fallback if the value is missing, null, or undefined
      if (result[key] === undefined || result[key] === null) {
        result[key] = fallbacks[key] as T[Extract<keyof T, string>];
      }
    }
  }
  
  return result;
}

/**
 * Applies fallback values to CoinData
 */
export function applyCoinDataFallbacks(data: Partial<CoinData>): CoinData {
  return applyFallbacks(data, CoinDataFallbacks) as CoinData;
}

/**
 * Applies fallback values to TokenomicsData
 */
export function applyTokenomicsDataFallbacks(data: Partial<TokenomicsData>): TokenomicsData {
  return applyFallbacks(data, TokenomicsDataFallbacks) as TokenomicsData;
}

/**
 * Applies fallback values to PriceHistory
 */
export function applyPriceHistoryFallbacks(data: Partial<PriceHistory>): PriceHistory {
  return applyFallbacks(data, PriceHistoryFallbacks) as PriceHistory;
}

/**
 * Applies fallback values to ExchangeRates
 */
export function applyExchangeRatesFallbacks(data: Partial<ExchangeRates>): ExchangeRates {
  return applyFallbacks(data, ExchangeRatesFallbacks) as ExchangeRates;
}

/**
 * Applies fallback values to MarketData
 */
export function applyMarketDataFallbacks(data: Partial<MarketData>): MarketData {
  const result: Partial<MarketData> = {
    coin: data.coin ? applyCoinDataFallbacks(data.coin) : applyCoinDataFallbacks({}),
    priceHistory: data.priceHistory || [],
    tokenomics: data.tokenomics ? applyTokenomicsDataFallbacks(data.tokenomics) : applyTokenomicsDataFallbacks({}),
  };
  
  return result as MarketData;
}

/**
 * Safely converts a value to a number, returning fallback if conversion fails
 */
export function safeNumber(value: unknown, fallback: number = 0): number {
  if (typeof value === 'number' && isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

/**
 * Safely converts a value to a nullable number, returning fallback if conversion fails
 */
export function safeNullableNumber(value: unknown, fallback: number | null = null): number | null {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (typeof value === 'number' && isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

/**
 * Safely converts a value to a string, returning fallback if conversion fails
 */
export function safeString(value: unknown, fallback: string = ''): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
}

