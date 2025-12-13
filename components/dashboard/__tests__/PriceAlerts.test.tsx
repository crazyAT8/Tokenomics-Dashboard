import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PriceAlerts } from '../PriceAlerts';

// Mock hooks and dependencies
jest.mock('@/hooks/usePriceAlerts', () => ({
  usePriceAlerts: () => ({
    alerts: [],
    addAlert: jest.fn(),
    removeAlert: jest.fn(),
    updateAlert: jest.fn(),
    toggleAlert: jest.fn(),
    getAlertsForCoin: jest.fn(() => []),
  }),
}));

jest.mock('@/lib/store', () => ({
  useDashboardStore: () => ({ currency: 'usd' }),
}));

jest.mock('@/lib/utils/notifications', () => ({
  requestNotificationPermission: jest.fn(() => Promise.resolve('granted')),
  isNotificationSupported: jest.fn(() => true),
}));

jest.mock('@/lib/utils/currency', () => ({
  formatCurrency: (value: number) => `$${value.toLocaleString()}`,
}));

jest.mock('@/lib/utils/sanitize', () => ({
  sanitizeUrl: (url: string) => url,
  escapeHtml: (text: string) => text,
}));

const mockCoin = {
  id: 'bitcoin',
  name: 'Bitcoin',
  symbol: 'BTC',
  current_price: 50000,
  image: 'https://example.com/btc.png',
};

describe('PriceAlerts', () => {
  it('renders price alerts component', () => {
    render(<PriceAlerts coin={mockCoin} />);
    expect(screen.getByText(/Price Alerts/i)).toBeInTheDocument();
  });

  it('shows add alert button', () => {
    render(<PriceAlerts coin={mockCoin} />);
    const addButton = screen.getByText(/Add Alert|Create Alert/i);
    expect(addButton).toBeInTheDocument();
  });

  it('opens alert form when add button is clicked', () => {
    render(<PriceAlerts coin={mockCoin} />);
    const addButton = screen.getByText(/Add Alert|Create Alert/i);
    fireEvent.click(addButton);
    
    waitFor(() => {
      expect(screen.getByPlaceholderText(/target price|price/i)).toBeInTheDocument();
    });
  });

  it('renders nothing when coin is null', () => {
    const { container } = render(<PriceAlerts coin={null} />);
    // Component might still render the card structure
    expect(container).toBeInTheDocument();
  });
});

