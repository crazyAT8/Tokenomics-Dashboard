import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TimeRangeSelector } from '../TimeRangeSelector';

// Mock DateRangePicker
jest.mock('@/components/ui/DateRangePicker', () => ({
  DateRangePicker: ({ fromDate, toDate, onFromDateChange, onToDateChange }: any) => (
    <div data-testid="date-range-picker">
      <button onClick={() => onFromDateChange(new Date(2024, 0, 1))}>Set From</button>
      <button onClick={() => onToDateChange(new Date(2024, 0, 15))}>Set To</button>
    </div>
  ),
}));

describe('TimeRangeSelector', () => {
  const mockOnRangeChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders preset buttons', () => {
    render(
      <TimeRangeSelector
        selectedRange={{ type: '7d', days: 7 }}
        onRangeChange={mockOnRangeChange}
      />
    );
    expect(screen.getByText('1D')).toBeInTheDocument();
    expect(screen.getByText('7D')).toBeInTheDocument();
    expect(screen.getByText('30D')).toBeInTheDocument();
    expect(screen.getByText('90D')).toBeInTheDocument();
    expect(screen.getByText('1Y')).toBeInTheDocument();
  });

  it('calls onRangeChange when preset is clicked', () => {
    render(
      <TimeRangeSelector
        selectedRange={{ type: '7d', days: 7 }}
        onRangeChange={mockOnRangeChange}
      />
    );
    const button = screen.getByText('1D');
    fireEvent.click(button);
    expect(mockOnRangeChange).toHaveBeenCalledWith({ type: '1d', days: 1 });
  });

  it('highlights selected preset', () => {
    render(
      <TimeRangeSelector
        selectedRange={{ type: '7d', days: 7 }}
        onRangeChange={mockOnRangeChange}
      />
    );
    const selectedButton = screen.getByText('7D');
    expect(selectedButton).toHaveClass('bg-primary-600');
  });

  it('shows custom date picker when custom button is clicked', () => {
    render(
      <TimeRangeSelector
        selectedRange={{ type: '7d', days: 7 }}
        onRangeChange={mockOnRangeChange}
      />
    );
    const customButton = screen.getByText('Custom');
    fireEvent.click(customButton);
    expect(screen.getByTestId('date-range-picker')).toBeInTheDocument();
  });

  it('applies custom date range', () => {
    render(
      <TimeRangeSelector
        selectedRange={{ type: 'custom', from: new Date(2024, 0, 1), to: new Date(2024, 0, 15), days: 14 }}
        onRangeChange={mockOnRangeChange}
      />
    );
    const customButton = screen.getByText('Custom');
    fireEvent.click(customButton);
    
    waitFor(() => {
      const setFromButton = screen.getByText('Set From');
      const setToButton = screen.getByText('Set To');
      fireEvent.click(setFromButton);
      fireEvent.click(setToButton);
      
      const applyButton = screen.getByText('Apply');
      fireEvent.click(applyButton);
      
      expect(mockOnRangeChange).toHaveBeenCalled();
    });
  });

  it('cancels custom date selection', () => {
    render(
      <TimeRangeSelector
        selectedRange={{ type: '7d', days: 7 }}
        onRangeChange={mockOnRangeChange}
      />
    );
    const customButton = screen.getByText('Custom');
    fireEvent.click(customButton);
    
    waitFor(() => {
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      expect(screen.queryByTestId('date-range-picker')).not.toBeInTheDocument();
    });
  });
});

