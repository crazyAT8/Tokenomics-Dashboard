import React from 'react';
import { render, screen } from '@testing-library/react';
import { TechnicalIndicatorsChart } from '../TechnicalIndicatorsChart';

// Mock recharts
jest.mock('recharts', () => ({
  ComposedChart: ({ children }: any) => <div data-testid="composed-chart">{children}</div>,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Line: () => null,
  Bar: () => null,
  ReferenceLine: () => null,
}));

// Mock technical analysis
jest.mock('@/lib/utils/technicalAnalysis', () => ({
  calculateAllIndicators: jest.fn(() => []),
  calculateAllIndicatorsOHLC: jest.fn(() => []),
}));

// Mock currency utils
jest.mock('@/lib/utils/currency', () => ({
  formatCurrencyFull: (value: number) => `$${value.toFixed(2)}`,
  CURRENCY_INFO: {
    usd: { symbol: '$', code: 'USD', name: 'US Dollar' },
  },
}));

const mockPriceData = [
  { timestamp: Date.now() - 86400000, price: 50000 },
  { timestamp: Date.now() - 43200000, price: 51000 },
  { timestamp: Date.now(), price: 52000 },
];

const mockOHLCData = [
  {
    timestamp: Date.now() - 86400000,
    open: 50000,
    high: 51000,
    low: 49000,
    close: 50500,
  },
  {
    timestamp: Date.now(),
    open: 50500,
    high: 52000,
    low: 50000,
    close: 51500,
  },
];

describe('TechnicalIndicatorsChart', () => {
  it('renders chart with price data', () => {
    render(<TechnicalIndicatorsChart priceData={mockPriceData} />);
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
  });

  it('renders chart with OHLC data', () => {
    render(<TechnicalIndicatorsChart ohlcData={mockOHLCData} />);
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
  });

  it('renders with custom height', () => {
    render(<TechnicalIndicatorsChart priceData={mockPriceData} height={300} />);
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
  });

  it('renders with currency prop', () => {
    render(<TechnicalIndicatorsChart priceData={mockPriceData} currency="usd" />);
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
  });

  it('renders with technical analysis settings', () => {
    const technicalAnalysis = {
      showSMA20: true,
      showSMA50: true,
      showSMA200: false,
      showEMA20: false,
      showEMA50: false,
      showRSI: true,
      showMACD: false,
      showBollingerBands: false,
      showSupportResistance: false,
    };
    render(
      <TechnicalIndicatorsChart
        priceData={mockPriceData}
        technicalAnalysis={technicalAnalysis}
      />
    );
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
  });

  it('renders with customization settings', () => {
    const customization = {
      lineColor: '#ff0000',
      backgroundColor: '#ffffff',
      gridColor: '#f0f0f0',
      axisColor: '#666666',
      showGrid: true,
      showAxisLabels: true,
      chartHeight: 300,
      lineWidth: 2,
      fontSize: 12,
      theme: 'light',
      enableAnimation: true,
    };
    render(
      <TechnicalIndicatorsChart
        priceData={mockPriceData}
        customization={customization}
      />
    );
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
  });

  it('handles empty price data', () => {
    render(<TechnicalIndicatorsChart priceData={[]} />);
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
  });

  it('handles empty OHLC data', () => {
    render(<TechnicalIndicatorsChart ohlcData={[]} />);
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
  });
});

