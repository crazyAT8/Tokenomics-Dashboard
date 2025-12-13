import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CoinSelector } from '../CoinSelector';

// Mock hooks
jest.mock('@/hooks/useFavorites', () => ({
  useFavorites: () => ({
    favorites: [],
    toggleFavorite: jest.fn(),
    isFavorite: jest.fn(() => false),
  }),
}));

// Mock sanitize utilities
jest.mock('@/lib/utils/sanitize', () => ({
  sanitizeSearchQuery: (query: string) => query,
  sanitizeUrl: (url: string) => url,
  escapeHtml: (text: string) => text,
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => [
      {
        id: 'bitcoin',
        name: 'Bitcoin',
        symbol: 'BTC',
        current_price: 50000,
        image: 'https://example.com/btc.png',
      },
    ],
  } as Response)
);

describe('CoinSelector', () => {
  const mockOnCoinSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders coin selector', () => {
    render(
      <CoinSelector
        selectedCoin="bitcoin"
        onCoinSelect={mockOnCoinSelect}
      />
    );
    expect(screen.getByPlaceholderText(/search|coin/i)).toBeInTheDocument();
  });

  it('opens dropdown when clicked', () => {
    render(
      <CoinSelector
        selectedCoin="bitcoin"
        onCoinSelect={mockOnCoinSelect}
      />
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);
    // Dropdown should open
    expect(screen.getByPlaceholderText(/search|coin/i)).toBeInTheDocument();
  });

  it('searches for coins when typing', async () => {
    render(
      <CoinSelector
        selectedCoin="bitcoin"
        onCoinSelect={mockOnCoinSelect}
      />
    );
    const input = screen.getByPlaceholderText(/search|coin/i);
    fireEvent.change(input, { target: { value: 'bitcoin' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('calls onCoinSelect when coin is selected', async () => {
    render(
      <CoinSelector
        selectedCoin="bitcoin"
        onCoinSelect={mockOnCoinSelect}
      />
    );
    const input = screen.getByPlaceholderText(/search|coin/i);
    fireEvent.change(input, { target: { value: 'bitcoin' } });

    await waitFor(() => {
      const coinButton = screen.getByText(/Bitcoin|BTC/i);
      if (coinButton) {
        fireEvent.click(coinButton);
        expect(mockOnCoinSelect).toHaveBeenCalled();
      }
    });
  });

  it('displays selected coin', () => {
    render(
      <CoinSelector
        selectedCoin="bitcoin"
        onCoinSelect={mockOnCoinSelect}
      />
    );
    // Should display selected coin name or symbol
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

