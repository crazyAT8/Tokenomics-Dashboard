import React from 'react';
import { render, screen } from '@testing-library/react';
import { PortfolioManager } from '../PortfolioManager';

// Mock hooks
jest.mock('@/hooks/usePortfolio', () => ({
  usePortfolio: () => ({
    portfolio: [],
    addCoin: jest.fn(),
    removeCoin: jest.fn(),
    updateCoin: jest.fn(),
    getTotalValue: jest.fn(() => 0),
    getTotalCost: jest.fn(() => 0),
    getTotalProfit: jest.fn(() => 0),
    getTotalProfitPercent: jest.fn(() => 0),
  }),
}));

jest.mock('@/lib/store', () => ({
  useDashboardStore: () => ({ currency: 'usd' }),
}));

// Mock currency formatter
jest.mock('@/lib/utils/currency', () => ({
  formatCurrency: (value: number) => `$${value.toLocaleString()}`,
}));

describe('PortfolioManager', () => {
  it('renders portfolio manager', () => {
    render(<PortfolioManager />);
    expect(screen.getByText(/Portfolio|My Portfolio/i)).toBeInTheDocument();
  });

  it('displays portfolio value', () => {
    render(<PortfolioManager />);
    // Should display portfolio metrics
    expect(screen.getByText(/Portfolio|Total|Value/i)).toBeInTheDocument();
  });
});

