import React from 'react';
import { render, screen } from '@testing-library/react';
import { PriceChart } from '../PriceChart';

// Mock recharts
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Area: () => null,
}));

// Mock technical analysis
jest.mock('@/lib/utils/technicalAnalysis', () => ({
  calculateAllIndicators: jest.fn(() => []),
}));

// Mock currency utils
jest.mock('@/lib/utils/currency', () => ({
  formatCurrency: (value: number) => `$${value}`,
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

describe('PriceChart', () => {
  it('renders chart with data', () => {
    render(<PriceChart data={mockPriceData} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('renders with custom height', () => {
    render(<PriceChart data={mockPriceData} height={400} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('renders with currency prop', () => {
    render(<PriceChart data={mockPriceData} currency="usd" />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
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
      <PriceChart
        data={mockPriceData}
        technicalAnalysis={technicalAnalysis}
      />
    );
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
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
      <PriceChart
        data={mockPriceData}
        customization={customization}
      />
    );
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('handles empty data array', () => {
    render(<PriceChart data={[]} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });
});

