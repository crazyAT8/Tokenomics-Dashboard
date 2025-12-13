import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChartTypeSelector } from '../ChartTypeSelector';

describe('ChartTypeSelector', () => {
  const mockOnChartTypeChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders line and candlestick options', () => {
    render(
      <ChartTypeSelector
        chartType="line"
        onChartTypeChange={mockOnChartTypeChange}
      />
    );
    expect(screen.getByLabelText('Line chart')).toBeInTheDocument();
    expect(screen.getByLabelText('Candlestick chart')).toBeInTheDocument();
  });

  it('calls onChartTypeChange when line is clicked', () => {
    render(
      <ChartTypeSelector
        chartType="candlestick"
        onChartTypeChange={mockOnChartTypeChange}
      />
    );
    const lineButton = screen.getByLabelText('Line chart');
    fireEvent.click(lineButton);
    expect(mockOnChartTypeChange).toHaveBeenCalledWith('line');
  });

  it('calls onChartTypeChange when candlestick is clicked', () => {
    render(
      <ChartTypeSelector
        chartType="line"
        onChartTypeChange={mockOnChartTypeChange}
      />
    );
    const candlestickButton = screen.getByLabelText('Candlestick chart');
    fireEvent.click(candlestickButton);
    expect(mockOnChartTypeChange).toHaveBeenCalledWith('candlestick');
  });

  it('highlights selected chart type', () => {
    render(
      <ChartTypeSelector
        chartType="line"
        onChartTypeChange={mockOnChartTypeChange}
      />
    );
    const lineButton = screen.getByLabelText('Line chart');
    expect(lineButton).toHaveClass('bg-primary-600');
  });

  it('shows unselected state for non-selected type', () => {
    render(
      <ChartTypeSelector
        chartType="line"
        onChartTypeChange={mockOnChartTypeChange}
      />
    );
    const candlestickButton = screen.getByLabelText('Candlestick chart');
    expect(candlestickButton).not.toHaveClass('bg-primary-600');
  });
});

