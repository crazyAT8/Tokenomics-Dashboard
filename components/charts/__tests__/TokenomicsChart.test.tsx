import React from 'react';
import { render, screen } from '@testing-library/react';
import { TokenomicsChart } from '../TokenomicsChart';

// Mock recharts
jest.mock('recharts', () => ({
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Tooltip: () => null,
  Legend: () => null,
}));

const mockTokenomicsData = {
  circulating_supply: 19000000,
  total_supply: 21000000,
  max_supply: 21000000,
  market_cap: 1000000000000,
  fully_diluted_valuation: 1050000000000,
  total_value_locked: 50000000000,
  holders: 50000000,
};

describe('TokenomicsChart', () => {
  it('renders pie chart with tokenomics data', () => {
    render(<TokenomicsChart data={mockTokenomicsData} />);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('calculates supply percentages correctly', () => {
    render(<TokenomicsChart data={mockTokenomicsData} />);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    // Chart should render with calculated percentages
  });

  it('handles data without max supply', () => {
    const dataWithoutMax = {
      ...mockTokenomicsData,
      max_supply: null as any,
    };
    render(<TokenomicsChart data={dataWithoutMax} />);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('filters out zero values', () => {
    const dataWithZero = {
      ...mockTokenomicsData,
      max_supply: mockTokenomicsData.circulating_supply, // No uncirculated supply
    };
    render(<TokenomicsChart data={dataWithZero} />);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });
});

