import { z } from 'zod';

// CoinData validation schema
export const CoinDataSchema = z.object({
  id: z.string().min(1),
  symbol: z.string().min(1),
  name: z.string().min(1),
  image: z.string().url().or(z.string().length(0)), // Allow empty string for image
  current_price: z.number().finite(),
  market_cap: z.number().finite().nonnegative(),
  market_cap_rank: z.number().int().nonnegative(),
  fully_diluted_valuation: z.number().finite().nonnegative().nullable(),
  total_volume: z.number().finite().nonnegative(),
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
  ath_date: z.string(),
  atl: z.number().finite().nonnegative().nullable(),
  atl_change_percentage: z.number().finite().nullable(),
  atl_date: z.string(),
  last_updated: z.string(),
});

// PriceHistory validation schema
export const PriceHistorySchema = z.object({
  timestamp: z.number().int().positive(),
  price: z.number().finite().positive(),
});

// PriceHistory array schema
export const PriceHistoryArraySchema = z.array(PriceHistorySchema).min(0);

// TokenomicsData validation schema
export const TokenomicsDataSchema = z.object({
  circulating_supply: z.number().finite().nonnegative().nullable(),
  total_supply: z.number().finite().nonnegative().nullable(),
  max_supply: z.number().finite().nonnegative().nullable(),
  market_cap: z.number().finite().nonnegative(),
  fully_diluted_valuation: z.number().finite().nonnegative().nullable(),
  price: z.number().finite().positive(),
  price_change_24h: z.number().finite().nullable(),
  price_change_percentage_24h: z.number().finite().nullable(),
  volume_24h: z.number().finite().nonnegative(),
  market_cap_rank: z.number().int().nonnegative(),
});

// MarketData validation schema
export const MarketDataSchema = z.object({
  coin: CoinDataSchema,
  priceHistory: PriceHistoryArraySchema,
  tokenomics: TokenomicsDataSchema,
});

// ExchangeRates validation schema
export const ExchangeRatesSchema = z.object({
  base: z.string().min(1),
  rates: z.record(z.string(), z.number().finite().positive()),
  timestamp: z.number().int().positive(),
});

// CoinGecko API response schemas (for raw API responses)
export const CoinGeckoCoinResponseSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  image: z.object({
    thumb: z.string().optional(),
    small: z.string().optional(),
    large: z.string().optional(),
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
    id: z.string(),
    symbol: z.string(),
    name: z.string(),
    image: z.string().optional(),
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
      id: z.string(),
      name: z.string(),
      symbol: z.string(),
      thumb: z.string().optional(),
      market_cap_rank: z.number().nullable().optional(),
    }).passthrough()
  ),
}).passthrough();

// ExchangeRate API response schema
export const ExchangeRateApiResponseSchema = z.object({
  base: z.string(),
  date: z.string().optional(),
  rates: z.record(z.string(), z.number()),
  success: z.boolean().optional(),
  timestamp: z.number().optional(),
}).passthrough();

