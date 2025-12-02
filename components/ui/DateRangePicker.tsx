'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { clsx } from 'clsx';

interface DateRangePickerProps {
  fromDate: Date | null;
  toDate: Date | null;
  onFromDateChange: (date: Date | null) => void;
  onToDateChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  minDate,
  maxDate,
}) => {
  const today = new Date();
  const defaultMaxDate = maxDate || today;
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = fromDate || toDate || today;
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  const monthYear = useMemo(() => {
    return {
      month: currentMonth.getMonth(),
      year: currentMonth.getFullYear(),
      monthName: currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };
  }, [currentMonth]);

  const daysInMonth = useMemo(() => {
    return new Date(monthYear.year, monthYear.month + 1, 0).getDate();
  }, [monthYear.year, monthYear.month]);

  const firstDayOfMonth = useMemo(() => {
    return new Date(monthYear.year, monthYear.month, 1).getDay();
  }, [monthYear.year, monthYear.month]);

  const normalizeDate = (date: Date): Date => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  const isDateInRange = (date: Date): boolean => {
    if (!fromDate || !toDate) return false;
    const normalizedDate = normalizeDate(date);
    const normalizedFrom = normalizeDate(fromDate);
    const normalizedTo = normalizeDate(toDate);
    return normalizedDate >= normalizedFrom && normalizedDate <= normalizedTo;
  };

  const isDateStart = (date: Date): boolean => {
    if (!fromDate) return false;
    return normalizeDate(date).getTime() === normalizeDate(fromDate).getTime();
  };

  const isDateEnd = (date: Date): boolean => {
    if (!toDate) return false;
    return normalizeDate(date).getTime() === normalizeDate(toDate).getTime();
  };

  const isDateDisabled = (date: Date): boolean => {
    const normalizedDate = normalizeDate(date);
    const normalizedMax = normalizeDate(defaultMaxDate);
    if (minDate) {
      const normalizedMin = normalizeDate(minDate);
      if (normalizedDate < normalizedMin) return true;
    }
    if (normalizedDate > normalizedMax) return true;
    return false;
  };

  const isDateToday = (date: Date): boolean => {
    return date.toDateString() === today.toDateString();
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(monthYear.year, monthYear.month, day);
    clickedDate.setHours(0, 0, 0, 0);
    
    if (isDateDisabled(clickedDate)) return;

    // If no dates selected, or both selected, start new selection
    if (!fromDate || (fromDate && toDate)) {
      onFromDateChange(clickedDate);
      onToDateChange(null);
      return;
    }

    // If only fromDate is selected
    if (fromDate && !toDate) {
      const normalizedFrom = normalizeDate(fromDate);
      if (normalizeDate(clickedDate) < normalizedFrom) {
        // Clicked date is before fromDate, make it the new fromDate
        onFromDateChange(clickedDate);
        onToDateChange(fromDate);
      } else {
        // Clicked date is after fromDate, make it the toDate
        onToDateChange(clickedDate);
      }
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const canNavigatePrev = useMemo(() => {
    if (!minDate) return true;
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    return prevMonth >= new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  }, [currentMonth, minDate]);

  const canNavigateNext = useMemo(() => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth <= new Date(defaultMaxDate.getFullYear(), defaultMaxDate.getMonth(), 1);
  }, [currentMonth, defaultMaxDate]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth('prev')}
          disabled={!canNavigatePrev}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-sm font-semibold text-gray-900">
          {monthYear.monthName}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth('next')}
          disabled={!canNavigateNext}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="w-full">
        {/* Week Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-500 py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const date = new Date(monthYear.year, monthYear.month, day);
            const disabled = isDateDisabled(date);
            const inRange = isDateInRange(date);
            const isStart = isDateStart(date);
            const isEnd = isDateEnd(date);
            const isToday = isDateToday(date);
            const isSelected = isStart || isEnd;

            return (
              <button
                key={day}
                type="button"
                onClick={() => handleDateClick(day)}
                disabled={disabled}
                className={clsx(
                  'aspect-square rounded-md text-sm font-medium transition-all touch-manipulation',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
                  {
                    // Disabled state
                    'text-gray-300 cursor-not-allowed': disabled,
                    // Normal state
                    'text-gray-700 hover:bg-gray-100 active:bg-gray-200': !disabled && !inRange && !isSelected,
                    // In range (between start and end)
                    'bg-primary-50 text-primary-700': inRange && !isStart && !isEnd,
                    // Start or end date
                    'bg-primary-600 text-white hover:bg-primary-700': isSelected,
                    // Today indicator
                    'ring-1 ring-gray-300': isToday && !isSelected,
                  }
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Range Display */}
      {(fromDate || toDate) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-2 text-xs">
            <div className="flex-1">
              <span className="text-gray-500">From:</span>{' '}
              <span className="font-medium text-gray-900">
                {fromDate ? fromDate.toLocaleDateString() : 'Not selected'}
              </span>
            </div>
            <div className="flex-1">
              <span className="text-gray-500">To:</span>{' '}
              <span className="font-medium text-gray-900">
                {toDate ? toDate.toLocaleDateString() : 'Not selected'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

