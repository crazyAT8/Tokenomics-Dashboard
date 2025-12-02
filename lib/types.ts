export interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}

export interface TokenomicsData {
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  market_cap: number;
  fully_diluted_valuation: number;
  price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  volume_24h: number;
  market_cap_rank: number;
}

export interface PriceHistory {
  timestamp: number;
  price: number;
}

export interface MarketData {
  coin: CoinData;
  priceHistory: PriceHistory[];
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