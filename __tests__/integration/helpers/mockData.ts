import { CoinData, PriceHistory, OHLCData, ExchangeRates } from '@/lib/types';

export const mockCoinData: CoinData = {
  id: 'bitcoin',
  symbol: 'btc',
  name: 'Bitcoin',
  image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  current_price: 50000,
  market_cap: 1000000000000,
  market_cap_rank: 1,
  fully_diluted_valuation: 1050000000000,
  total_volume: 50000000000,
  high_24h: 51000,
  low_24h: 49000,
  price_change_24h: 1000,
  price_change_percentage_24h: 2.04,
  market_cap_change_24h: 20000000000,
  market_cap_change_percentage_24h: 2.0,
  circulating_supply: 20000000,
  total_supply: 21000000,
  max_supply: 21000000,
  ath: 69000,
  ath_change_percentage: -27.54,
  ath_date: '2021-11-10T14:24:11.849Z',
  atl: 67.81,
  atl_change_percentage: 73630.49,
  atl_date: '2013-07-06T00:00:00.000Z',
  last_updated: new Date().toISOString(),
};

export const mockPriceHistory: PriceHistory[] = [
  { timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000, price: 48000 },
  { timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000, price: 48500 },
  { timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000, price: 49000 },
  { timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000, price: 49500 },
  { timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000, price: 50000 },
  { timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, price: 50500 },
  { timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000, price: 50000 },
  { timestamp: Date.now(), price: 50000 },
];

export const mockOHLCData: OHLCData[] = [
  {
    timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
    open: 48000,
    high: 48500,
    low: 47500,
    close: 48500,
    volume: 1000000,
  },
  {
    timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000,
    open: 48500,
    high: 49000,
    low: 48000,
    close: 49000,
    volume: 1100000,
  },
  {
    timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
    open: 49000,
    high: 49500,
    low: 48500,
    close: 49500,
    volume: 1200000,
  },
];

export const mockExchangeRates: ExchangeRates = {
  base: 'usd',
  rates: {
    eur: 0.85,
    gbp: 0.73,
    jpy: 110.0,
    cad: 1.25,
    aud: 1.35,
    btc: 0.00002,
  },
  timestamp: Date.now(),
};

export const mockCoinGeckoCoinResponse = {
  id: 'bitcoin',
  symbol: 'btc',
  name: 'Bitcoin',
  image: {
    thumb: 'https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png',
    small: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
    large: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  },
  market_data: {
    current_price: { usd: 50000 },
    market_cap: { usd: 1000000000000 },
    market_cap_rank: 1,
    fully_diluted_valuation: { usd: 1050000000000 },
    total_volume: { usd: 50000000000 },
    high_24h: { usd: 51000 },
    low_24h: { usd: 49000 },
    price_change_24h: 1000,
    price_change_percentage_24h: 2.04,
    market_cap_change_24h: 20000000000,
    market_cap_change_percentage_24h: 2.0,
    circulating_supply: 20000000,
    total_supply: 21000000,
    max_supply: 21000000,
    ath: { usd: 69000 },
    ath_change_percentage: { usd: -27.54 },
    ath_date: { usd: '2021-11-10T14:24:11.849Z' },
    atl: { usd: 67.81 },
    atl_change_percentage: { usd: 73630.49 },
    atl_date: { usd: '2013-07-06T00:00:00.000Z' },
    last_updated: new Date().toISOString(),
  },
};

export const mockCoinGeckoMarketResponse = [
  {
    id: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    current_price: 50000,
    market_cap: 1000000000000,
    market_cap_rank: 1,
    fully_diluted_valuation: 1050000000000,
    total_volume: 50000000000,
    high_24h: 51000,
    low_24h: 49000,
    price_change_24h: 1000,
    price_change_percentage_24h: 2.04,
    market_cap_change_24h: 20000000000,
    market_cap_change_percentage_24h: 2.0,
    circulating_supply: 20000000,
    total_supply: 21000000,
    max_supply: 21000000,
    ath: 69000,
    ath_change_percentage: -27.54,
    ath_date: '2021-11-10T14:24:11.849Z',
    atl: 67.81,
    atl_change_percentage: 73630.49,
    atl_date: '2013-07-06T00:00:00.000Z',
    last_updated: new Date().toISOString(),
  },
];

export const mockCoinGeckoMarketChartResponse = {
  prices: mockPriceHistory.map((ph) => [ph.timestamp, ph.price]),
  market_caps: mockPriceHistory.map((ph) => [ph.timestamp, ph.price * 20000000]),
  total_volumes: mockPriceHistory.map((ph) => [ph.timestamp, 1000000]),
};

export const mockCoinGeckoOHLCResponse = mockOHLCData.map((ohlc) => [
  ohlc.timestamp,
  ohlc.open,
  ohlc.high,
  ohlc.low,
  ohlc.close,
]);

export const mockCoinGeckoSearchResponse = {
  coins: [
    {
      id: 'bitcoin',
      name: 'Bitcoin',
      symbol: 'btc',
      market_cap_rank: 1,
      thumb: 'https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png',
      large: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    },
    {
      id: 'ethereum',
      name: 'Ethereum',
      symbol: 'eth',
      market_cap_rank: 2,
      thumb: 'https://assets.coingecko.com/coins/images/279/thumb/ethereum.png',
      large: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    },
  ],
};

export const mockExchangeRateApiResponse = {
  base: 'USD',
  date: new Date().toISOString().split('T')[0],
  rates: {
    EUR: 0.85,
    GBP: 0.73,
    JPY: 110.0,
    CAD: 1.25,
    AUD: 1.35,
    BTC: 0.00002,
  },
  timestamp: Date.now(),
};

