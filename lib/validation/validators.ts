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
 * Validates CoinData
 */
export function validateCoinData(data: unknown): CoinData {
  return validate(CoinDataSchema, data, 'Invalid coin data structure');
}

/**
 * Validates PriceHistory array
 */
export function validatePriceHistory(data: unknown): PriceHistory[] {
  return validate(PriceHistoryArraySchema, data, 'Invalid price history data structure');
}

/**
 * Validates ExchangeRates
 */
export function validateExchangeRates(data: unknown): ExchangeRates {
  return validate(ExchangeRatesSchema, data, 'Invalid exchange rates data structure');
}

/**
 * Validates MarketData
 */
export function validateMarketData(data: unknown): MarketData {
  return validate(MarketDataSchema, data, 'Invalid market data structure');
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

