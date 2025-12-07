export interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number | null;
  low_24h: number | null;
  price_change_24h: number | null;
  price_change_percentage_24h: number | null;
  market_cap_change_24h: number | null;
  market_cap_change_percentage_24h: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  max_supply: number | null;
  ath: number | null;
  ath_change_percentage: number | null;
  ath_date: string;
  atl: number | null;
  atl_change_percentage: number | null;
  atl_date: string;
  last_updated: string;
}

export interface TokenomicsData {
  circulating_supply: number | null;
  total_supply: number | null;
  max_supply: number | null;
  market_cap: number;
  fully_diluted_valuation: number | null;
  price: number;
  price_change_24h: number | null;
  price_change_percentage_24h: number | null;
  volume_24h: number;
  market_cap_rank: number;
}

export interface PriceHistory {
  timestamp: number;
  price: number;
}

export interface OHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export type ChartType = 'line' | 'candlestick';

export interface MarketData {
  coin: CoinData;
  priceHistory: PriceHistory[];
  ohlcData?: OHLCData[];
  tokenomics: TokenomicsData;
}

export interface DashboardState {
  selectedCoin: string;
  marketData: MarketData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
}