import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChartCustomizationControls } from '../ChartCustomizationControls';

const mockOnSettingsChange = jest.fn();

const defaultSettings = {
  lineColor: '#3b82f6',
  backgroundColor: '#ffffff',
  gridColor: '#f0f0f0',
  axisColor: '#666666',
  showGrid: true,
  showAxisLabels: true,
  chartHeight: null,
  lineWidth: 2.5,
  fontSize: 12,
  theme: 'light',
  enableAnimation: true,
};

describe('ChartCustomizationControls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders customization controls', () => {
    render(
      <ChartCustomizationControls
        settings={defaultSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );
    expect(screen.getByText(/Customize|Chart|Settings/i)).toBeInTheDocument();
  });

  it('allows toggling grid visibility', () => {
    render(
      <ChartCustomizationControls
        settings={defaultSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );
    const gridToggle = screen.getByLabelText(/Show Grid|Grid/i);
    if (gridToggle) {
      fireEvent.click(gridToggle);
      expect(mockOnSettingsChange).toHaveBeenCalled();
    }
  });

  it('allows changing line color', () => {
    render(
      <ChartCustomizationControls
        settings={defaultSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );
    const colorInput = screen.getByLabelText(/Line Color|Color/i);
    if (colorInput) {
      fireEvent.change(colorInput, { target: { value: '#ff0000' } });
      expect(mockOnSettingsChange).toHaveBeenCalled();
    }
  });
});

