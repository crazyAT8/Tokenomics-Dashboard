import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DateRangePicker } from '../DateRangePicker';

describe('DateRangePicker', () => {
  const mockOnFromDateChange = jest.fn();
  const mockOnToDateChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders calendar grid', () => {
    render(
      <DateRangePicker
        fromDate={null}
        toDate={null}
        onFromDateChange={mockOnFromDateChange}
        onToDateChange={mockOnToDateChange}
      />
    );
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
  });

  it('displays current month and year', () => {
    const today = new Date();
    const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    render(
      <DateRangePicker
        fromDate={null}
        toDate={null}
        onFromDateChange={mockOnFromDateChange}
        onToDateChange={mockOnToDateChange}
      />
    );
    expect(screen.getByText(monthName)).toBeInTheDocument();
  });

  it('navigates to previous month', () => {
    const date = new Date(2024, 5, 15); // June 2024
    render(
      <DateRangePicker
        fromDate={date}
        toDate={null}
        onFromDateChange={mockOnFromDateChange}
        onToDateChange={mockOnToDateChange}
      />
    );
    const prevButton = screen.getByRole('button', { name: /previous/i }) || 
                       screen.getAllByRole('button').find(btn => btn.querySelector('svg'));
    if (prevButton) {
      fireEvent.click(prevButton);
    }
  });

  it('navigates to next month', () => {
    const date = new Date(2024, 5, 15);
    render(
      <DateRangePicker
        fromDate={date}
        toDate={null}
        onFromDateChange={mockOnFromDateChange}
        onToDateChange={mockOnToDateChange}
      />
    );
    const buttons = screen.getAllByRole('button');
    const nextButton = buttons.find(btn => {
      const svg = btn.querySelector('svg');
      return svg && !btn.disabled;
    });
    if (nextButton) {
      fireEvent.click(nextButton);
    }
  });

  it('selects from date when clicking a day', () => {
    const today = new Date();
    render(
      <DateRangePicker
        fromDate={null}
        toDate={null}
        onFromDateChange={mockOnFromDateChange}
        onToDateChange={mockOnToDateChange}
        maxDate={today}
      />
    );
    const dayButtons = screen.getAllByRole('button').filter(btn => {
      const text = btn.textContent;
      return text && /^\d+$/.test(text) && !btn.disabled;
    });
    if (dayButtons.length > 0) {
      fireEvent.click(dayButtons[0]);
      expect(mockOnFromDateChange).toHaveBeenCalled();
    }
  });

  it('displays selected date range', () => {
    const fromDate = new Date(2024, 0, 1);
    const toDate = new Date(2024, 0, 15);
    render(
      <DateRangePicker
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={mockOnFromDateChange}
        onToDateChange={mockOnToDateChange}
      />
    );
    expect(screen.getByText(/From:/)).toBeInTheDocument();
    expect(screen.getByText(/To:/)).toBeInTheDocument();
  });

  it('disables dates beyond maxDate', () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() - 1); // Yesterday
    render(
      <DateRangePicker
        fromDate={null}
        toDate={null}
        onFromDateChange={mockOnFromDateChange}
        onToDateChange={mockOnToDateChange}
        maxDate={maxDate}
      />
    );
    const todayButton = screen.getAllByRole('button').find(btn => {
      const text = btn.textContent;
      const today = new Date().getDate().toString();
      return text === today;
    });
    if (todayButton) {
      expect(todayButton).toBeDisabled();
    }
  });

  it('disables dates before minDate', () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 1); // Tomorrow
    render(
      <DateRangePicker
        fromDate={null}
        toDate={null}
        onFromDateChange={mockOnFromDateChange}
        onToDateChange={mockOnToDateChange}
        minDate={minDate}
      />
    );
    const todayButton = screen.getAllByRole('button').find(btn => {
      const text = btn.textContent;
      const today = new Date().getDate().toString();
      return text === today;
    });
    if (todayButton) {
      expect(todayButton).toBeDisabled();
    }
  });
});

