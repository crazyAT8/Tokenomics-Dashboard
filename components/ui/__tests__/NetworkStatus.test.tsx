import React from 'react';
import { render, screen } from '@testing-library/react';
import { NetworkStatus } from '../NetworkStatus';

describe('NetworkStatus', () => {
  it('renders nothing when online and was not offline', () => {
    const { container } = render(
      <NetworkStatus isOnline={true} wasOffline={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders connection restored message when online and was offline', () => {
    render(<NetworkStatus isOnline={true} wasOffline={true} />);
    expect(screen.getByText('Connection restored')).toBeInTheDocument();
    expect(screen.getByText('Connection restored').parentElement).toHaveClass('bg-green-50');
  });

  it('renders no internet connection message when offline', () => {
    render(<NetworkStatus isOnline={false} wasOffline={true} />);
    expect(screen.getByText('No internet connection')).toBeInTheDocument();
    expect(screen.getByText('No internet connection').parentElement).toHaveClass('bg-red-50');
  });

  it('renders no internet connection message when offline and was not offline', () => {
    render(<NetworkStatus isOnline={false} wasOffline={false} />);
    expect(screen.getByText('No internet connection')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <NetworkStatus
        isOnline={false}
        wasOffline={true}
        className="custom-class"
      />
    );
    const status = screen.getByText('No internet connection').parentElement;
    expect(status).toHaveClass('custom-class');
  });

  it('displays wifi icon when online', () => {
    render(<NetworkStatus isOnline={true} wasOffline={true} />);
    const svg = screen.getByText('Connection restored').parentElement?.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('displays wifi-off icon when offline', () => {
    render(<NetworkStatus isOnline={false} wasOffline={true} />);
    const svg = screen.getByText('No internet connection').parentElement?.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});

