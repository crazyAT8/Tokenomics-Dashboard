import React from 'react';
import { render, screen } from '@testing-library/react';
import { TokenomicsOverview } from '../TokenomicsOverview';

// Mock dependencies
jest.mock('@/components/charts/TokenomicsChart', () => ({
  TokenomicsChart: () => <div data-testid="tokenomics-chart">Chart</div>,
}));

jest.mock('@/lib/utils/currency', () => ({
  formatCurrency: (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(value);
  },
}));

const mockTokenomics = {
  circulating_supply: 19000000,
  total_supply: 21000000,
  max_supply: 21000000,
  market_cap: 1000000000000,
  fully_diluted_valuation: 1050000000000,
  total_value_locked: 50000000000,
  holders: 50000000,
};

describe('TokenomicsOverview', () => {
  it('renders tokenomics metrics', () => {
    render(<TokenomicsOverview tokenomics={mockTokenomics} currency="usd" />);
    expect(screen.getByText(/Market Cap/i)).toBeInTheDocument();
    expect(screen.getByText(/Circulating Supply/i)).toBeInTheDocument();
  });

  it('displays market cap', () => {
    render(<TokenomicsOverview tokenomics={mockTokenomics} currency="usd" />);
    expect(screen.getByText(/Market Cap/i)).toBeInTheDocument();
  });

  it('displays supply metrics', () => {
    render(<TokenomicsOverview tokenomics={mockTokenomics} currency="usd" />);
    expect(screen.getByText(/Circulating Supply/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Supply/i)).toBeInTheDocument();
  });

  it('renders tokenomics chart', () => {
    render(<TokenomicsOverview tokenomics={mockTokenomics} currency="usd" />);
    expect(screen.getByTestId('tokenomics-chart')).toBeInTheDocument();
  });

  it('calculates supply utilization', () => {
    render(<TokenomicsOverview tokenomics={mockTokenomics} currency="usd" />);
    // Should display supply utilization percentage
    expect(screen.getByText(/Supply Utilization/i)).toBeInTheDocument();
  });
});

