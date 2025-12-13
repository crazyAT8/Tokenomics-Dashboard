import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../Header';

describe('Header', () => {
  const mockOnRefresh = jest.fn();
  const mockOnThemeToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title', () => {
    render(
      <Header
        onRefresh={mockOnRefresh}
        isLoading={false}
        lastUpdated={null}
        theme="light"
        onThemeToggle={mockOnThemeToggle}
      />
    );
    expect(screen.getByText('Tokenomics Dashboard')).toBeInTheDocument();
  });

  it('calls onRefresh when refresh button is clicked', () => {
    render(
      <Header
        onRefresh={mockOnRefresh}
        isLoading={false}
        lastUpdated={null}
        theme="light"
        onThemeToggle={mockOnThemeToggle}
      />
    );
    const refreshButton = screen.getByText('Refresh') || screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);
    expect(mockOnRefresh).toHaveBeenCalled();
  });

  it('calls onThemeToggle when theme button is clicked', () => {
    render(
      <Header
        onRefresh={mockOnRefresh}
        isLoading={false}
        lastUpdated={null}
        theme="light"
        onThemeToggle={mockOnThemeToggle}
      />
    );
    const themeButton = screen.getByText('Dark Mode') || screen.getByRole('button', { name: /dark|light/i });
    fireEvent.click(themeButton);
    expect(mockOnThemeToggle).toHaveBeenCalled();
  });

  it('shows loading state on refresh button', () => {
    render(
      <Header
        onRefresh={mockOnRefresh}
        isLoading={true}
        lastUpdated={null}
        theme="light"
        onThemeToggle={mockOnThemeToggle}
      />
    );
    const refreshButton = screen.getByText('Refresh') || screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeDisabled();
  });

  it('displays last updated time', () => {
    const lastUpdated = new Date();
    lastUpdated.setMinutes(lastUpdated.getMinutes() - 5);
    render(
      <Header
        onRefresh={mockOnRefresh}
        isLoading={false}
        lastUpdated={lastUpdated}
        theme="light"
        onThemeToggle={mockOnThemeToggle}
      />
    );
    expect(screen.getByText(/ago|Just now/i)).toBeInTheDocument();
  });

  it('displays network status when provided', () => {
    render(
      <Header
        onRefresh={mockOnRefresh}
        isLoading={false}
        lastUpdated={null}
        networkStatus={{ isOnline: false, wasOffline: true }}
        theme="light"
        onThemeToggle={mockOnThemeToggle}
      />
    );
    // NetworkStatus component should be rendered
    expect(screen.getByText(/connection|internet/i)).toBeInTheDocument();
  });

  it('disables refresh button when offline', () => {
    render(
      <Header
        onRefresh={mockOnRefresh}
        isLoading={false}
        lastUpdated={null}
        networkStatus={{ isOnline: false, wasOffline: true }}
        theme="light"
        onThemeToggle={mockOnThemeToggle}
      />
    );
    const refreshButton = screen.getByText('Refresh') || screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeDisabled();
  });

  it('shows dark mode button when theme is light', () => {
    render(
      <Header
        onRefresh={mockOnRefresh}
        isLoading={false}
        lastUpdated={null}
        theme="light"
        onThemeToggle={mockOnThemeToggle}
      />
    );
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
  });

  it('shows light mode button when theme is dark', () => {
    render(
      <Header
        onRefresh={mockOnRefresh}
        isLoading={false}
        lastUpdated={null}
        theme="dark"
        onThemeToggle={mockOnThemeToggle}
      />
    );
    expect(screen.getByText('Light Mode')).toBeInTheDocument();
  });
});

