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
  volume?: number;
}

export type ChartType = 'line' | 'candlestick';

export interface TechnicalAnalysisSettings {
  showSMA20: boolean;
  showSMA50: boolean;
  showSMA200: boolean;
  showEMA20: boolean;
  showEMA50: boolean;
  showRSI: boolean;
  showMACD: boolean;
  showBollingerBands: boolean;
  showSupportResistance: boolean;
}

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

export type Theme = 'light' | 'dark';

export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
}

export interface ChartCustomizationSettings {
  // Colors
  lineColor: string;
  backgroundColor: string;
  gridColor: string;
  axisColor: string;
  
  // Display options
  showGrid: boolean;
  showAxisLabels: boolean;
  chartHeight: number | null; // null means auto
  
  // Styling
  lineWidth: number;
  fontSize: number;
  
  // Theme
  theme: Theme;
  
  // Animation
  enableAnimation: boolean;
}

export interface PortfolioEntry {
  id: string;
  coinId: string;
  name: string;
  symbol: string;
  image: string;
  quantity: number;
  purchasePrice?: number; // Optional purchase price for future profit/loss calculations
  addedAt: number;
}

export type PortfolioTransactionType = 'buy' | 'sell';

export interface PortfolioTransaction {
  id: string;
  coinId: string;
  type: PortfolioTransactionType;
  quantity: number;
  price: number;
  fee?: number;
  timestamp: number;
  note?: string;
}

export type PortfolioContributionType = 'contribution' | 'withdrawal';

export interface PortfolioContribution {
  id: string;
  type: PortfolioContributionType;
  amount: number;
  timestamp: number;
  note?: string;
}

export interface PortfolioState {
  entries: PortfolioEntry[];
  transactions: PortfolioTransaction[];
  contributions: PortfolioContribution[];
}