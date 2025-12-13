import React from 'react';
import { render, screen } from '@testing-library/react';
import { PortfolioPerformanceMetrics } from '../PortfolioPerformanceMetrics';

// Mock hooks
jest.mock('@/hooks/usePortfolio', () => ({
  usePortfolio: () => ({
    portfolio: [],
    getTotalValue: jest.fn(() => 10000),
    getTotalCost: jest.fn(() => 8000),
    getTotalProfit: jest.fn(() => 2000),
    getTotalProfitPercent: jest.fn(() => 25),
  }),
}));

jest.mock('@/lib/store', () => ({
  useDashboardStore: () => ({ currency: 'usd' }),
}));

// Mock currency formatter
jest.mock('@/lib/utils/currency', () => ({
  formatCurrency: (value: number) => `$${value.toLocaleString()}`,
}));

describe('PortfolioPerformanceMetrics', () => {
  it('renders performance metrics', () => {
    render(<PortfolioPerformanceMetrics />);
    expect(screen.getByText(/Performance|Metrics|Profit|Loss/i)).toBeInTheDocument();
  });

  it('displays total value', () => {
    render(<PortfolioPerformanceMetrics />);
    expect(screen.getByText(/Total Value|Portfolio Value/i)).toBeInTheDocument();
  });

  it('displays profit/loss', () => {
    render(<PortfolioPerformanceMetrics />);
    expect(screen.getByText(/Profit|Loss|P&L/i)).toBeInTheDocument();
  });
});

