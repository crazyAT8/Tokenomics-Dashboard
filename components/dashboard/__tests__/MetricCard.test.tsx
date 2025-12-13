import React from 'react';
import { render, screen } from '@testing-library/react';
import { MetricCard } from '../MetricCard';

// Mock the currency formatter
jest.mock('@/lib/utils/currency', () => ({
  formatCurrency: (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(value);
  },
}));

describe('MetricCard', () => {
  it('renders title and value', () => {
    render(<MetricCard title="Price" value="$50,000" />);
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('$50,000')).toBeInTheDocument();
  });

  it('formats numeric value with currency', () => {
    render(<MetricCard title="Price" value={50000} currency="usd" />);
    expect(screen.getByText(/50000|50,000/)).toBeInTheDocument();
  });

  it('displays positive change with trending up icon', () => {
    render(
      <MetricCard
        title="Price"
        value="$50,000"
        change={5.5}
        changeType="positive"
      />
    );
    expect(screen.getByText('+5.50%')).toBeInTheDocument();
    const svg = screen.getByText('+5.50%').parentElement?.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('displays negative change with trending down icon', () => {
    render(
      <MetricCard
        title="Price"
        value="$50,000"
        change={-3.2}
        changeType="negative"
      />
    );
    expect(screen.getByText('-3.20%')).toBeInTheDocument();
  });

  it('displays neutral change', () => {
    render(
      <MetricCard
        title="Price"
        value="$50,000"
        change={0}
        changeType="neutral"
      />
    );
    expect(screen.getByText('0.00%')).toBeInTheDocument();
  });

  it('displays subtitle when provided', () => {
    render(
      <MetricCard
        title="Price"
        value="$50,000"
        subtitle="24h change"
      />
    );
    expect(screen.getByText('24h change')).toBeInTheDocument();
  });

  it('displays icon when provided', () => {
    const icon = <span data-testid="test-icon">📊</span>;
    render(
      <MetricCard
        title="Price"
        value="$50,000"
        icon={icon}
      />
    );
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('handles string value', () => {
    render(<MetricCard title="Status" value="Active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('handles number value without currency', () => {
    render(<MetricCard title="Count" value={123} />);
    expect(screen.getByText(/123/)).toBeInTheDocument();
  });
});

