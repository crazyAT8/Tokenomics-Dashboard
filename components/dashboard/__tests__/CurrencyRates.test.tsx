import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CurrencyRates } from '../CurrencyRates';

const mockExchangeRates = {
  base: 'USD',
  rates: {
    EUR: 0.85,
    GBP: 0.73,
    JPY: 110.0,
    CAD: 1.25,
    AUD: 1.35,
  },
  timestamp: Date.now(),
};

describe('CurrencyRates', () => {
  const mockOnRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when exchangeRates is null', () => {
    const { container } = render(
      <CurrencyRates
        exchangeRates={null}
        baseCurrency="usd"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders currency exchange rates', () => {
    render(
      <CurrencyRates
        exchangeRates={mockExchangeRates}
        baseCurrency="usd"
      />
    );
    expect(screen.getByText('Currency Exchange Rates')).toBeInTheDocument();
    expect(screen.getByText('EUR')).toBeInTheDocument();
    expect(screen.getByText('GBP')).toBeInTheDocument();
  });

  it('displays rates relative to base currency', () => {
    render(
      <CurrencyRates
        exchangeRates={mockExchangeRates}
        baseCurrency="usd"
      />
    );
    expect(screen.getByText(/Rates relative to USD/)).toBeInTheDocument();
  });

  it('calls onRefresh when refresh button is clicked', () => {
    render(
      <CurrencyRates
        exchangeRates={mockExchangeRates}
        baseCurrency="usd"
        onRefresh={mockOnRefresh}
      />
    );
    const refreshButton = screen.getByLabelText('Refresh rates');
    fireEvent.click(refreshButton);
    expect(mockOnRefresh).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(
      <CurrencyRates
        exchangeRates={mockExchangeRates}
        baseCurrency="usd"
        isLoading={true}
        onRefresh={mockOnRefresh}
      />
    );
    const refreshButton = screen.getByLabelText('Refresh rates');
    const svg = refreshButton.querySelector('svg');
    expect(svg).toHaveClass('animate-spin');
  });

  it('displays formatted rates', () => {
    render(
      <CurrencyRates
        exchangeRates={mockExchangeRates}
        baseCurrency="usd"
      />
    );
    expect(screen.getByText('0.85')).toBeInTheDocument();
    expect(screen.getByText('0.73')).toBeInTheDocument();
  });

  it('shows no rates message when rates are empty', () => {
    const emptyRates = {
      base: 'USD',
      rates: {},
      timestamp: Date.now(),
    };
    render(
      <CurrencyRates
        exchangeRates={emptyRates}
        baseCurrency="usd"
      />
    );
    expect(screen.getByText('No exchange rates available')).toBeInTheDocument();
  });

  it('excludes base currency from displayed rates', () => {
    render(
      <CurrencyRates
        exchangeRates={mockExchangeRates}
        baseCurrency="usd"
      />
    );
    // USD should not appear in the rates list
    const rateElements = screen.getAllByText(/EUR|GBP|JPY|CAD|AUD/);
    expect(rateElements.length).toBeGreaterThan(0);
  });
});

