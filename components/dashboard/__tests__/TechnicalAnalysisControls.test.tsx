import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TechnicalAnalysisControls } from '../TechnicalAnalysisControls';

const mockOnSettingsChange = jest.fn();

const defaultSettings = {
  showSMA20: false,
  showSMA50: false,
  showSMA200: false,
  showEMA20: false,
  showEMA50: false,
  showRSI: false,
  showMACD: false,
  showBollingerBands: false,
  showSupportResistance: false,
};

describe('TechnicalAnalysisControls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders technical analysis controls', () => {
    render(
      <TechnicalAnalysisControls
        settings={defaultSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );
    expect(screen.getByText(/Technical Analysis|Indicators/i)).toBeInTheDocument();
  });

  it('allows toggling SMA indicators', () => {
    render(
      <TechnicalAnalysisControls
        settings={defaultSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );
    const sma20Toggle = screen.getByLabelText(/SMA 20|20-day/i);
    if (sma20Toggle) {
      fireEvent.click(sma20Toggle);
      expect(mockOnSettingsChange).toHaveBeenCalled();
    }
  });

  it('allows toggling RSI indicator', () => {
    render(
      <TechnicalAnalysisControls
        settings={defaultSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );
    const rsiToggle = screen.getByLabelText(/RSI/i);
    if (rsiToggle) {
      fireEvent.click(rsiToggle);
      expect(mockOnSettingsChange).toHaveBeenCalled();
    }
  });
});

