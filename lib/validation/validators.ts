import { z } from 'zod';
import { 
  CoinDataSchema, 
  PriceHistoryArraySchema, 
  ExchangeRatesSchema, 
  MarketDataSchema,
  CoinGeckoCoinResponseSchema,
  CoinGeckoMarketResponseSchema,
  CoinGeckoMarketChartResponseSchema,
  CoinGeckoSearchResponseSchema,
  ExchangeRateApiResponseSchema,
} from './schemas';
import { CoinData, PriceHistory, ExchangeRates, MarketData } from '../types';
import {
  applyCoinDataFallbacks,
  applyTokenomicsDataFallbacks,
  applyPriceHistoryFallbacks,
  applyExchangeRatesFallbacks,
  applyMarketDataFallbacks,
  safeNumber,
  safeNullableNumber,
  safeString,
} from './fallbacks';

/**
 * Validation error class for better error handling
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: z.ZodError,
    public readonly data: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates and returns typed data, or throws ValidationError
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown, errorMessage?: string): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = errorMessage || `Validation failed: ${error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ')}`;
      throw new ValidationError(message, error, data);
    }
    throw error;
  }
}

/**
 * Validates data with fallback values applied for missing fields
 */
export function validateWithFallbacks<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  applyFallbacksFn?: (data: any) => any,
  errorMessage?: string
): T {
  try {
    // Apply fallbacks if function provided
    const dataWithFallbacks = applyFallbacksFn ? applyFallbacksFn(data) : data;
    return schema.parse(dataWithFallbacks);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = errorMessage || `Validation failed: ${error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ')}`;
      throw new ValidationError(message, error, data);
    }
    throw error;
  }
}

/**
 * Safely validates data and returns a result object
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Validates CoinData with fallback values for missing fields
 */
export function validateCoinData(data: unknown): CoinData {
  // Normalize the data object first
  const normalized = typeof data === 'object' && data !== null ? data as Partial<CoinData> : {};
  
  // Apply fallbacks for missing or null/undefined values
  const dataWithFallbacks = applyCoinDataFallbacks(normalized);
  
  return validate(CoinDataSchema, dataWithFallbacks, 'Invalid coin data structure');
}

/**
 * Validates PriceHistory array with fallback values for missing fields
 */
export function validatePriceHistory(data: unknown): PriceHistory[] {
  if (!Array.isArray(data)) {
    return [];
  }
  
  // Apply fallbacks to each price history entry
  const dataWithFallbacks = data.map((item) => {
    const normalized = typeof item === 'object' && item !== null ? item as Partial<PriceHistory> : {};
    return applyPriceHistoryFallbacks(normalized);
  });
  
  return validate(PriceHistoryArraySchema, dataWithFallbacks, 'Invalid price history data structure');
}

/**
 * Validates ExchangeRates with fallback values for missing fields
 */
export function validateExchangeRates(data: unknown): ExchangeRates {
  const normalized = typeof data === 'object' && data !== null ? data as Partial<ExchangeRates> : {};
  
  // Apply fallbacks for missing or null/undefined values
  const dataWithFallbacks = applyExchangeRatesFallbacks(normalized);
  
  return validate(ExchangeRatesSchema, dataWithFallbacks, 'Invalid exchange rates data structure');
}

/**
 * Validates MarketData with fallback values for missing fields
 */
export function validateMarketData(data: unknown): MarketData {
  const normalized = typeof data === 'object' && data !== null ? data as Partial<MarketData> : {};
  
  // Apply fallbacks for missing or null/undefined values
  const dataWithFallbacks = applyMarketDataFallbacks(normalized);
  
  return validate(MarketDataSchema, dataWithFallbacks, 'Invalid market data structure');
}

/**
 * Validates CoinGecko coin API response
 */
export function validateCoinGeckoCoinResponse(data: unknown) {
  return validate(CoinGeckoCoinResponseSchema, data, 'Invalid CoinGecko coin API response');
}

/**
 * Validates CoinGecko market API response
 */
export function validateCoinGeckoMarketResponse(data: unknown) {
  return validate(CoinGeckoMarketResponseSchema, data, 'Invalid CoinGecko market API response');
}

/**
 * Validates CoinGecko market chart API response
 */
export function validateCoinGeckoMarketChartResponse(data: unknown) {
  return validate(CoinGeckoMarketChartResponseSchema, data, 'Invalid CoinGecko market chart API response');
}

/**
 * Validates CoinGecko search API response
 */
export function validateCoinGeckoSearchResponse(data: unknown) {
  return validate(CoinGeckoSearchResponseSchema, data, 'Invalid CoinGecko search API response');
}

/**
 * Validates ExchangeRate API response
 */
export function validateExchangeRateApiResponse(data: unknown) {
  return validate(ExchangeRateApiResponseSchema, data, 'Invalid exchange rate API response');
}

