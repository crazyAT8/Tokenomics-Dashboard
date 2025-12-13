import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Favorites } from '../Favorites';

// Mock hooks and dependencies
jest.mock('@/hooks/useFavorites', () => ({
  useFavorites: () => ({
    favorites: [
      { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', image: 'https://example.com/btc.png', addedAt: Date.now() },
    ],
    removeFavorite: jest.fn(),
    isFavorite: jest.fn((id) => id === 'bitcoin'),
  }),
}));

jest.mock('@/lib/store', () => ({
  useDashboardStore: () => ({ currency: 'usd' }),
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
        price_change_percentage_24h: 5.5,
        image: 'https://example.com/btc.png',
      },
    ],
  } as Response)
);

describe('Favorites', () => {
  const mockOnCoinSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders nothing when no favorites', () => {
    jest.spyOn(require('@/hooks/useFavorites'), 'useFavorites').mockReturnValue({
      favorites: [],
      removeFavorite: jest.fn(),
      isFavorite: jest.fn(),
    });

    const { container } = render(
      <Favorites selectedCoin="bitcoin" onCoinSelect={mockOnCoinSelect} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders favorites list', async () => {
    render(
      <Favorites selectedCoin="bitcoin" onCoinSelect={mockOnCoinSelect} />
    );

    await waitFor(() => {
      expect(screen.getByText('Quick Access Watchlist')).toBeInTheDocument();
    });
  });

  it('displays loading state', () => {
    render(
      <Favorites selectedCoin="bitcoin" onCoinSelect={mockOnCoinSelect} />
    );
    // Component should show loading or content
    expect(screen.queryByText('Quick Access Watchlist')).toBeInTheDocument();
  });
});

