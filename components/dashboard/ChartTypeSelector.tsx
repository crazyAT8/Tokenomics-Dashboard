'use client';

import React from 'react';
import { ChartType } from '@/lib/types';
import { LineChart, BarChart3 } from 'lucide-react';

interface ChartTypeSelectorProps {
  chartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
}

export const ChartTypeSelector: React.FC<ChartTypeSelectorProps> = ({
  chartType,
  onChartTypeChange,
}) => {
  return (
    <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-md p-1">
      <button
        onClick={() => onChartTypeChange('line')}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all
          min-h-[44px] sm:min-h-[36px] touch-manipulation active:scale-[0.97]
          ${chartType === 'line'
            ? 'bg-primary-600 text-white'
            : 'text-gray-600 hover:bg-gray-50'
          }
        `}
        aria-label="Line chart"
      >
        <LineChart className="h-4 w-4" />
        <span className="hidden sm:inline">Line</span>
      </button>
      <button
        onClick={() => onChartTypeChange('candlestick')}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all
          min-h-[44px] sm:min-h-[36px] touch-manipulation active:scale-[0.97]
          ${chartType === 'candlestick'
            ? 'bg-primary-600 text-white'
            : 'text-gray-600 hover:bg-gray-50'
          }
        `}
        aria-label="Candlestick chart"
      >
        <BarChart3 className="h-4 w-4" />
        <span className="hidden sm:inline">Candlestick</span>
      </button>
    </div>
  );
};

