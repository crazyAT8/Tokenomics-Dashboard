import { z } from 'zod';
import { sanitizeString, sanitizeUrl, sanitizeCoinId } from '@/lib/utils/sanitize';

// Helper to create sanitized string schema
const sanitizedString = (minLength: number = 1) => 
  z.string().transform((val) => sanitizeString(val, { maxLength: 1000 })).refine((val) => val.length >= minLength, {
    message: `String must be at least ${minLength} character(s)`,
  });

// Helper to create sanitized URL schema
const sanitizedUrl = () => 
  z.string().transform((val) => sanitizeUrl(val) || '').refine((val) => val.length === 0 || val.startsWith('http'), {
    message: 'Invalid URL format',
  });

// CoinData validation schema with fallback defaults
export const CoinDataSchema = z.object({
  id: z.string().transform((val) => sanitizeCoinId(val)).refine((val) => val.length > 0, {
    message: 'Coin ID is required',
  }),
  symbol: sanitizedString(1),
  name: sanitizedString(1),
  image: z.string().default('').transform((val) => {
    const sanitized = sanitizeUrl(val);
    return sanitized || ''; // Allow empty string for image
  }).refine((val) => val.length === 0 || val.startsWith('http'), {
    message: 'Invalid image URL',
  }),
  current_price: z.number().finite().default(0),
  market_cap: z.number().finite().nonnegative().default(0),
  market_cap_rank: z.number().int().nonnegative().default(0),
  fully_diluted_valuation: z.number().finite().nonnegative().nullable(),
  total_volume: z.number().finite().nonnegative().default(0),
  high_24h: z.number().finite().nonnegative().nullable(),
  low_24h: z.number().finite().nonnegative().nullable(),
  price_change_24h: z.number().finite().nullable(),
  price_change_percentage_24h: z.number().finite().nullable(),
  market_cap_change_24h: z.number().finite().nullable(),
  market_cap_change_percentage_24h: z.number().finite().nullable(),
  circulating_supply: z.number().finite().nonnegative().nullable(),
  total_supply: z.number().finite().nonnegative().nullable(),
  max_supply: z.number().finite().nonnegative().nullable(),
  ath: z.number().finite().nonnegative().nullable(),
  ath_change_percentage: z.number().finite().nullable(),
  ath_date: z.string().default('').transform((val) => sanitizeString(val, { maxLength: 1000 })),
  atl: z.number().finite().nonnegative().nullable(),
  atl_change_percentage: z.number().finite().nullable(),
  atl_date: z.string().default('').transform((val) => sanitizeString(val, { maxLength: 1000 })),
  last_updated: z.string().default(() => new Date().toISOString()).transform((val) => sanitizeString(val, { maxLength: 1000 })),
});

// PriceHistory validation schema with fallback defaults
export const PriceHistorySchema = z.object({
  timestamp: z.number().int().nonnegative().default(() => Date.now()),
  price: z.number().finite().nonnegative().default(0), // Allow 0 as fallback, will be validated separately
});

// PriceHistory array schema
export const PriceHistoryArraySchema = z.array(PriceHistorySchema).min(0);

// OHLCData validation schema
export const OHLCDataSchema = z.object({
  timestamp: z.number().int().nonnegative().default(() => Date.now()),
  open: z.number().finite().nonnegative().default(0),
  high: z.number().finite().nonnegative().default(0),
  low: z.number().finite().nonnegative().default(0),
  close: z.number().finite().nonnegative().default(0),
});

// OHLCData array schema
export const OHLCDataArraySchema = z.array(OHLCDataSchema).min(0);

// CoinGecko OHLC response schema (array of [timestamp, open, high, low, close])
export const CoinGeckoOHLCResponseSchema = z.array(
  z.tuple([z.number(), z.number(), z.number(), z.number(), z.number()])
);

// TokenomicsData validation schema with fallback defaults
export const TokenomicsDataSchema = z.object({
  circulating_supply: z.number().finite().nonnegative().nullable(),
  total_supply: z.number().finite().nonnegative().nullable(),
  max_supply: z.number().finite().nonnegative().nullable(),
  market_cap: z.number().finite().nonnegative().default(0),
  fully_diluted_valuation: z.number().finite().nonnegative().nullable(),
  price: z.number().finite().nonnegative().default(0), // Allow 0 as fallback, will be validated separately
  price_change_24h: z.number().finite().nullable(),
  price_change_percentage_24h: z.number().finite().nullable(),
  volume_24h: z.number().finite().nonnegative().default(0),
  market_cap_rank: z.number().int().nonnegative().default(0),
});

// MarketData validation schema
export const MarketDataSchema = z.object({
  coin: CoinDataSchema,
  priceHistory: PriceHistoryArraySchema,
  ohlcData: OHLCDataArraySchema.optional(),
  tokenomics: TokenomicsDataSchema,
});

// ExchangeRates validation schema with fallback defaults
export const ExchangeRatesSchema = z.object({
  base: z.string().default('usd').transform((val) => sanitizeString(val, { maxLength: 10 }).toLowerCase()).refine((val) => val.length > 0, {
    message: 'Base currency is required',
  }),
  rates: z.record(
    z.string().transform((val) => sanitizeString(val, { maxLength: 10 }).toUpperCase()),
    z.number().finite().positive()
  ).default({}),
  timestamp: z.number().int().positive().default(() => Date.now()),
});

// CoinGecko API response schemas (for raw API responses)
// Note: These schemas are for raw API responses, so we sanitize during transformation
export const CoinGeckoCoinResponseSchema = z.object({
  id: z.string().transform((val) => sanitizeCoinId(val)),
  symbol: z.string().transform((val) => sanitizeString(val)),
  name: z.string().transform((val) => sanitizeString(val)),
  image: z.object({
    thumb: z.string().optional().transform((val) => val ? sanitizeUrl(val) || '' : ''),
    small: z.string().optional().transform((val) => val ? sanitizeUrl(val) || '' : ''),
    large: z.string().optional().transform((val) => val ? sanitizeUrl(val) || '' : ''),
  }).optional(),
  market_data: z.object({
    current_price: z.record(z.string(), z.number()).optional(),
    market_cap: z.record(z.string(), z.number()).optional(),
    market_cap_rank: z.number().optional(),
    fully_diluted_valuation: z.record(z.string(), z.number()).optional(),
    total_volume: z.record(z.string(), z.number()).optional(),
    high_24h: z.record(z.string(), z.number()).optional(),
    low_24h: z.record(z.string(), z.number()).optional(),
    price_change_24h: z.number().optional(),
    price_change_percentage_24h: z.number().optional(),
    market_cap_change_24h: z.number().optional(),
    market_cap_change_percentage_24h: z.number().optional(),
    circulating_supply: z.number().optional(),
    total_supply: z.number().optional(),
    max_supply: z.number().optional(),
    ath: z.record(z.string(), z.number()).optional(),
    ath_change_percentage: z.record(z.string(), z.number()).optional(),
    ath_date: z.record(z.string(), z.string()).optional(),
    atl: z.record(z.string(), z.number()).optional(),
    atl_change_percentage: z.record(z.string(), z.number()).optional(),
    atl_date: z.record(z.string(), z.string()).optional(),
    last_updated: z.string().optional(),
  }).optional(),
}).passthrough(); // Allow additional fields

export const CoinGeckoMarketResponseSchema = z.array(
  z.object({
    id: z.string().transform((val) => sanitizeCoinId(val)),
    symbol: z.string().transform((val) => sanitizeString(val)),
    name: z.string().transform((val) => sanitizeString(val)),
    image: z.string().optional().transform((val) => val ? sanitizeUrl(val) || '' : ''),
    current_price: z.number().nullable(),
    market_cap: z.number().nullable(),
    market_cap_rank: z.number().nullable(),
    fully_diluted_valuation: z.number().nullable(),
    total_volume: z.number().nullable(),
    high_24h: z.number().nullable(),
    low_24h: z.number().nullable(),
    price_change_24h: z.number().nullable(),
    price_change_percentage_24h: z.number().nullable(),
    market_cap_change_24h: z.number().nullable(),
    market_cap_change_percentage_24h: z.number().nullable(),
    circulating_supply: z.number().nullable(),
    total_supply: z.number().nullable(),
    max_supply: z.number().nullable(),
    ath: z.number().nullable(),
    ath_change_percentage: z.number().nullable(),
    ath_date: z.string().nullable(),
    atl: z.number().nullable(),
    atl_change_percentage: z.number().nullable(),
    atl_date: z.string().nullable(),
    last_updated: z.string().nullable(),
  }).passthrough()
);

export const CoinGeckoMarketChartResponseSchema = z.object({
  prices: z.array(z.tuple([z.number(), z.number()])),
  market_caps: z.array(z.tuple([z.number(), z.number()])).optional(),
  total_volumes: z.array(z.tuple([z.number(), z.number()])).optional(),
}).passthrough();

export const CoinGeckoSearchResponseSchema = z.object({
  coins: z.array(
    z.object({
      id: z.string().transform((val) => sanitizeCoinId(val)),
      name: z.string().transform((val) => sanitizeString(val)),
      symbol: z.string().transform((val) => sanitizeString(val)),
      thumb: z.string().optional().transform((val) => val ? sanitizeUrl(val) || '' : ''),
      market_cap_rank: z.number().nullable().optional(),
    }).passthrough()
  ),
}).passthrough();

// ExchangeRate API response schema
export const ExchangeRateApiResponseSchema = z.object({
  base: z.string().transform((val) => sanitizeString(val, { maxLength: 10 }).toUpperCase()),
  date: z.string().optional().transform((val) => val ? sanitizeString(val) : undefined),
  rates: z.record(
    z.string().transform((val) => sanitizeString(val, { maxLength: 10 }).toUpperCase()),
    z.number()
  ),
  success: z.boolean().optional(),
  timestamp: z.number().optional(),
}).passthrough();

