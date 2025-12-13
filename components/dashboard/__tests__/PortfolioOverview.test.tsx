import React from 'react';
import { render, screen } from '@testing-library/react';
import { PortfolioOverview } from '../PortfolioOverview';

// Mock currency formatter
jest.mock('@/lib/utils/currency', () => ({
  formatCurrency: (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(value);
  },
}));

// Mock sanitize utilities
jest.mock('@/lib/utils/sanitize', () => ({
  sanitizeUrl: (url: string) => url,
  escapeHtml: (text: string) => text,
}));

const mockCoins = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    current_price: 50000,
    market_cap: 1000000000000,
    total_volume: 50000000000,
    price_change_percentage_24h: 5.5,
    image: 'https://example.com/btc.png',
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    current_price: 3000,
    market_cap: 500000000000,
    total_volume: 30000000000,
    price_change_percentage_24h: -2.3,
    image: 'https://example.com/eth.png',
  },
];

describe('PortfolioOverview', () => {
  it('renders nothing when coins array is empty', () => {
    const { container } = render(
      <PortfolioOverview coins={[]} currency="usd" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders portfolio metrics', () => {
    render(<PortfolioOverview coins={mockCoins} currency="usd" />);
    expect(screen.getByText(/Total Market Cap/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Volume/i)).toBeInTheDocument();
  });

  it('calculates and displays total market cap', () => {
    render(<PortfolioOverview coins={mockCoins} currency="usd" />);
    // Should display aggregated market cap
    expect(screen.getByText(/Total Market Cap/i)).toBeInTheDocument();
  });

  it('displays best performer', () => {
    render(<PortfolioOverview coins={mockCoins} currency="usd" />);
    expect(screen.getByText(/Best Performer/i)).toBeInTheDocument();
  });

  it('displays worst performer', () => {
    render(<PortfolioOverview coins={mockCoins} currency="usd" />);
    expect(screen.getByText(/Worst Performer/i)).toBeInTheDocument();
  });
});

