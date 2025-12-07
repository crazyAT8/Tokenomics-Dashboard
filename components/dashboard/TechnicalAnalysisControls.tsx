'use client';

import React, { useState } from 'react';
import { TechnicalAnalysisSettings } from '@/lib/types';
import { 
  TrendingUp, 
  BarChart3, 
  Activity, 
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface TechnicalAnalysisControlsProps {
  settings: TechnicalAnalysisSettings;
  onToggle: (indicator: keyof TechnicalAnalysisSettings) => void;
}

export const TechnicalAnalysisControls: React.FC<TechnicalAnalysisControlsProps> = ({
  settings,
  onToggle,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const indicators = [
    {
      key: 'showSMA20' as const,
      label: 'SMA 20',
      description: 'Simple Moving Average (20 period)',
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    {
      key: 'showSMA50' as const,
      label: 'SMA 50',
      description: 'Simple Moving Average (50 period)',
      icon: TrendingUp,
      color: 'text-purple-600',
    },
    {
      key: 'showSMA200' as const,
      label: 'SMA 200',
      description: 'Simple Moving Average (200 period)',
      icon: TrendingUp,
      color: 'text-indigo-600',
    },
    {
      key: 'showEMA20' as const,
      label: 'EMA 20',
      description: 'Exponential Moving Average (20 period)',
      icon: TrendingUp,
      color: 'text-cyan-600',
    },
    {
      key: 'showEMA50' as const,
      label: 'EMA 50',
      description: 'Exponential Moving Average (50 period)',
      icon: TrendingUp,
      color: 'text-teal-600',
    },
    {
      key: 'showBollingerBands' as const,
      label: 'Bollinger Bands',
      description: 'Price volatility bands',
      icon: Layers,
      color: 'text-orange-600',
    },
    {
      key: 'showRSI' as const,
      label: 'RSI',
      description: 'Relative Strength Index',
      icon: Activity,
      color: 'text-pink-600',
    },
    {
      key: 'showMACD' as const,
      label: 'MACD',
      description: 'Moving Average Convergence Divergence',
      icon: BarChart3,
      color: 'text-green-600',
    },
    {
      key: 'showSupportResistance' as const,
      label: 'Support/Resistance',
      description: 'Key price levels',
      icon: Layers,
      color: 'text-yellow-600',
    },
  ];

  const activeCount = Object.values(settings).filter(Boolean).length;

  return (
    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between hover:bg-gray-50 transition-colors min-h-[44px] sm:min-h-[40px] touch-manipulation"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
          <span className="text-sm sm:text-base font-medium text-gray-700">
            Technical Analysis
          </span>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
              {activeCount} active
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {indicators.map((indicator) => {
              const Icon = indicator.icon;
              const isActive = settings[indicator.key];
              
              return (
                <button
                  key={indicator.key}
                  onClick={() => onToggle(indicator.key)}
                  className={`
                    flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-md border transition-all
                    min-h-[44px] sm:min-h-[36px] touch-manipulation active:scale-[0.97]
                    text-left
                    ${isActive
                      ? 'bg-primary-50 border-primary-300 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }
                  `}
                  aria-label={`${isActive ? 'Hide' : 'Show'} ${indicator.label}`}
                >
                  <div className={`
                    flex-shrink-0 p-1.5 rounded
                    ${isActive ? 'bg-primary-100' : 'bg-gray-100'}
                  `}>
                    <Icon className={`h-4 w-4 ${isActive ? indicator.color : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-medium truncate">
                      {indicator.label}
                    </div>
                    <div className="text-xs text-gray-500 truncate hidden sm:block">
                      {indicator.description}
                    </div>
                  </div>
                  <div className={`
                    flex-shrink-0 w-5 h-5 rounded border-2 transition-all
                    ${isActive
                      ? 'bg-primary-600 border-primary-600'
                      : 'border-gray-300'
                    }
                  `}>
                    {isActive && (
                      <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

