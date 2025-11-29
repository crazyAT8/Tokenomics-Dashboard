'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

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
  { value: '1d', label: '1 Day', days: 1 },
  { value: '7d', label: '7 Days', days: 7 },
  { value: '30d', label: '30 Days', days: 30 },
  { value: '90d', label: '90 Days', days: 90 },
  { value: '1y', label: '1 Year', days: 365 },
];

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  selectedRange,
  onRangeChange,
}) => {
  const [showCustomPicker, setShowCustomPicker] = useState(selectedRange.type === 'custom');
  const [fromDate, setFromDate] = useState(
    selectedRange.from ? selectedRange.from.toISOString().split('T')[0] : ''
  );
  const [toDate, setToDate] = useState(
    selectedRange.to ? selectedRange.to.toISOString().split('T')[0] : ''
  );

  // Sync local state with selectedRange prop changes
  useEffect(() => {
    setShowCustomPicker(selectedRange.type === 'custom');
    if (selectedRange.from) {
      setFromDate(selectedRange.from.toISOString().split('T')[0]);
    }
    if (selectedRange.to) {
      setToDate(selectedRange.to.toISOString().split('T')[0]);
    }
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
      setFromDate(from.toISOString().split('T')[0]);
      setToDate(to.toISOString().split('T')[0]);
    }
  };

  const handleCustomDateApply = () => {
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      
      // Validate dates
      if (from > to) {
        alert('Start date must be before end date');
        return;
      }
      
      // Check if range is not too far in the future
      const now = new Date();
      if (to > now) {
        alert('End date cannot be in the future');
        return;
      }

      // Check if range is not too old (max 1 year)
      const maxDays = 365;
      const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > maxDays) {
        alert(`Date range cannot exceed ${maxDays} days`);
        return;
      }

      onRangeChange({
        type: 'custom',
        from,
        to,
        days: daysDiff,
      });
    }
  };

  const handleCustomDateCancel = () => {
    if (selectedRange.type !== 'custom') {
      setShowCustomPicker(false);
      setFromDate('');
      setToDate('');
    } else {
      // Reset to previous custom dates
      setFromDate(selectedRange.from ? selectedRange.from.toISOString().split('T')[0] : '');
      setToDate(selectedRange.to ? selectedRange.to.toISOString().split('T')[0] : '');
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
            className="min-w-[50px] sm:min-w-[60px] text-xs sm:text-sm flex-1 sm:flex-none"
          >
            {preset.label}
          </Button>
        ))}
        <Button
          variant={selectedRange.type === 'custom' ? 'primary' : 'outline'}
          size="sm"
          onClick={handleCustomRangeClick}
          className="flex items-center gap-1 text-xs sm:text-sm flex-1 sm:flex-none"
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
                  className="text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                  aria-label="Close custom picker"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  From Date
                </label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  max={toDate || new Date().toISOString().split('T')[0]}
                  className="min-h-[44px] text-base sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  To Date
                </label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  min={fromDate}
                  max={new Date().toISOString().split('T')[0]}
                  className="min-h-[44px] text-base sm:text-sm"
                />
              </div>
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
                className="flex-1 min-h-[44px] sm:min-h-[32px]"
              >
                Apply
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCustomDateCancel}
                className="flex-1 min-h-[44px] sm:min-h-[32px]"
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

