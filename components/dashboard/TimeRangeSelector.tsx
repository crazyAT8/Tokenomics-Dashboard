'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DateRangePicker } from '@/components/ui/DateRangePicker';

export type TimeRangePreset = '1d' | '7d' | '30d' | '90d' | '1y' | 'custom';

export interface TimeRange {
  type: TimeRangePreset;
  days?: number;
  from?: Date;
  to?: Date;
}

interface TimeRangeSelectorProps {
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
}

const PRESETS: { value: TimeRangePreset; label: string; days: number }[] = [
  { value: '1d', label: '1D', days: 1 },
  { value: '7d', label: '7D', days: 7 },
  { value: '30d', label: '30D', days: 30 },
  { value: '90d', label: '90D', days: 90 },
  { value: '1y', label: '1Y', days: 365 },
];

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  selectedRange,
  onRangeChange,
}) => {
  const [showCustomPicker, setShowCustomPicker] = useState(selectedRange.type === 'custom');
  const [fromDate, setFromDate] = useState<Date | null>(
    selectedRange.from || null
  );
  const [toDate, setToDate] = useState<Date | null>(
    selectedRange.to || null
  );

  // Sync local state with selectedRange prop changes
  useEffect(() => {
    setShowCustomPicker(selectedRange.type === 'custom');
    setFromDate(selectedRange.from || null);
    setToDate(selectedRange.to || null);
  }, [selectedRange]);

  const handlePresetClick = (preset: TimeRangePreset, days: number) => {
    setShowCustomPicker(false);
    onRangeChange({ type: preset, days });
  };

  const handleCustomRangeClick = () => {
    setShowCustomPicker(true);
    if (!fromDate || !toDate) {
      // Set default custom range to last 30 days if not set
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 30);
      setFromDate(from);
      setToDate(to);
    }
  };

  const handleCustomDateApply = () => {
    if (fromDate && toDate) {
      // Normalize dates for comparison (ignore time)
      const normalizedFrom = new Date(fromDate);
      normalizedFrom.setHours(0, 0, 0, 0);
      const normalizedTo = new Date(toDate);
      normalizedTo.setHours(0, 0, 0, 0);
      
      // Validate dates
      if (normalizedFrom > normalizedTo) {
        alert('Start date must be before end date');
        return;
      }
      
      // Check if range is not too far in the future
      const now = new Date();
      now.setHours(23, 59, 59, 999); // Set to end of today
      if (normalizedTo > now) {
        alert('End date cannot be in the future');
        return;
      }

      // Check if range is not too old (max 1 year)
      const maxDays = 365;
      const daysDiff = Math.ceil((normalizedTo.getTime() - normalizedFrom.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > maxDays) {
        alert(`Date range cannot exceed ${maxDays} days`);
        return;
      }

      onRangeChange({
        type: 'custom',
        from: normalizedFrom,
        to: normalizedTo,
        days: daysDiff,
      });
    }
  };

  const handleCustomDateCancel = () => {
    if (selectedRange.type !== 'custom') {
      setShowCustomPicker(false);
      setFromDate(null);
      setToDate(null);
    } else {
      // Reset to previous custom dates
      setFromDate(selectedRange.from || null);
      setToDate(selectedRange.to || null);
    }
  };

  // Format date for display
  const formatDateRange = () => {
    if (selectedRange.type === 'custom' && selectedRange.from && selectedRange.to) {
      return `${selectedRange.from.toLocaleDateString()} - ${selectedRange.to.toLocaleDateString()}`;
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-3">
        {PRESETS.map((preset) => (
          <Button
            key={preset.value}
            variant={selectedRange.type === preset.value ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handlePresetClick(preset.value, preset.days)}
            className="min-w-[50px] sm:min-w-[60px] min-h-[44px] sm:min-h-[32px] text-xs sm:text-sm flex-1 sm:flex-none touch-manipulation"
          >
            {preset.label}
          </Button>
        ))}
        <Button
          variant={selectedRange.type === 'custom' ? 'primary' : 'outline'}
          size="sm"
          onClick={handleCustomRangeClick}
          className="flex items-center gap-1 text-xs sm:text-sm flex-1 sm:flex-none min-h-[44px] sm:min-h-[32px] touch-manipulation"
        >
          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline">Custom</span>
          <span className="xs:hidden">Custom</span>
        </Button>
      </div>

      {showCustomPicker && (
        <Card className="p-3 sm:p-4 mt-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-medium text-gray-700">Custom Date Range</h3>
              {selectedRange.type === 'custom' && (
                <button
                  onClick={() => {
                    const preset = PRESETS[1]; // Default to 7 days
                    handlePresetClick(preset.value, preset.days);
                  }}
                  className="text-gray-400 hover:text-gray-600 active:text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation active:scale-95 transition-transform"
                  aria-label="Close custom picker"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <div className="w-full">
              <DateRangePicker
                fromDate={fromDate}
                toDate={toDate}
                onFromDateChange={setFromDate}
                onToDateChange={setToDate}
                maxDate={new Date()}
              />
            </div>

            {selectedRange.type === 'custom' && formatDateRange() && (
              <p className="text-xs text-gray-500 break-words">
                Selected: {formatDateRange()}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleCustomDateApply}
                disabled={!fromDate || !toDate}
                className="flex-1 min-h-[44px] sm:min-h-[32px] touch-manipulation"
              >
                Apply
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCustomDateCancel}
                className="flex-1 min-h-[44px] sm:min-h-[32px] touch-manipulation"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

