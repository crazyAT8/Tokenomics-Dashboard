import React from 'react';
import { render, screen } from '@testing-library/react';
import { CandlestickChart } from '../CandlestickChart';

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
  Cell: () => null,
  Area: () => null,
}));

// Mock technical analysis
jest.mock('@/lib/utils/technicalAnalysis', () => ({
  calculateAllIndicatorsOHLC: jest.fn(() => []),
}));

// Mock currency utils
jest.mock('@/lib/utils/currency', () => ({
  formatCurrencyFull: (value: number) => `$${value.toFixed(2)}`,
  CURRENCY_INFO: {
    usd: { symbol: '$', code: 'USD', name: 'US Dollar' },
  },
}));

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

describe('CandlestickChart', () => {
  it('renders chart with OHLC data', () => {
    render(<CandlestickChart data={mockOHLCData} />);
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
  });

  it('renders with custom height', () => {
    render(<CandlestickChart data={mockOHLCData} height={400} />);
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
  });

  it('renders with currency prop', () => {
    render(<CandlestickChart data={mockOHLCData} currency="usd" />);
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
  });

  it('renders with technical analysis settings', () => {
    const technicalAnalysis = {
      showSMA20: true,
      showSMA50: false,
      showSMA200: false,
      showEMA20: false,
      showEMA50: false,
      showRSI: false,
      showMACD: false,
      showBollingerBands: false,
      showSupportResistance: false,
    };
    render(
      <CandlestickChart
        data={mockOHLCData}
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
      chartHeight: 400,
      lineWidth: 2,
      fontSize: 12,
      theme: 'light',
      enableAnimation: true,
    };
    render(
      <CandlestickChart
        data={mockOHLCData}
        customization={customization}
      />
    );
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
  });

  it('handles empty data array', () => {
    render(<CandlestickChart data={[]} />);
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
  });
});

