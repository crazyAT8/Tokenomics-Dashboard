import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CurrencySelector } from '../CurrencySelector';

describe('CurrencySelector', () => {
  const mockOnCurrencySelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with selected currency', () => {
    render(
      <CurrencySelector
        selectedCurrency="usd"
        onCurrencySelect={mockOnCurrencySelect}
      />
    );
    expect(screen.getByText('USD')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', () => {
    render(
      <CurrencySelector
        selectedCurrency="usd"
        onCurrencySelect={mockOnCurrencySelect}
      />
    );
    const button = screen.getByText('USD');
    fireEvent.click(button);
    expect(screen.getByText('Select Currency')).toBeInTheDocument();
  });

  it('calls onCurrencySelect when currency is selected', () => {
    render(
      <CurrencySelector
        selectedCurrency="usd"
        onCurrencySelect={mockOnCurrencySelect}
      />
    );
    const button = screen.getByText('USD');
    fireEvent.click(button);
    
    waitFor(() => {
      const eurButton = screen.getByText('EUR');
      fireEvent.click(eurButton);
      expect(mockOnCurrencySelect).toHaveBeenCalledWith('eur');
    });
  });

  it('closes dropdown after selection', () => {
    render(
      <CurrencySelector
        selectedCurrency="usd"
        onCurrencySelect={mockOnCurrencySelect}
      />
    );
    const button = screen.getByText('USD');
    fireEvent.click(button);
    
    waitFor(() => {
      const eurButton = screen.getByText('EUR');
      fireEvent.click(eurButton);
      expect(screen.queryByText('Select Currency')).not.toBeInTheDocument();
    });
  });

  it('highlights selected currency in dropdown', () => {
    render(
      <CurrencySelector
        selectedCurrency="usd"
        onCurrencySelect={mockOnCurrencySelect}
      />
    );
    const button = screen.getByText('USD');
    fireEvent.click(button);
    
    waitFor(() => {
      const selectedItem = screen.getByText('USD').closest('button');
      expect(selectedItem).toHaveClass('bg-primary-50');
    });
  });

  it('closes dropdown when clicking outside', () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <CurrencySelector
          selectedCurrency="usd"
          onCurrencySelect={mockOnCurrencySelect}
        />
      </div>
    );
    const button = screen.getByText('USD');
    fireEvent.click(button);
    
    waitFor(() => {
      expect(screen.getByText('Select Currency')).toBeInTheDocument();
      const outside = screen.getByTestId('outside');
      fireEvent.mouseDown(outside);
      expect(screen.queryByText('Select Currency')).not.toBeInTheDocument();
    });
  });
});

