'use client';

import React, { useState } from 'react';
import { ChartCustomizationSettings } from '@/lib/types';
import { 
  Palette,
  ChevronDown,
  ChevronUp,
  Grid3x3,
  Type,
  Gauge,
  Sun,
  Moon,
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface ChartCustomizationControlsProps {
  settings: ChartCustomizationSettings;
  onUpdate: (settings: Partial<ChartCustomizationSettings>) => void;
  onReset: () => void;
}

const COLOR_PRESETS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Indigo', value: '#6366f1' },
];

export const ChartCustomizationControls: React.FC<ChartCustomizationControlsProps> = ({
  settings,
  onUpdate,
  onReset,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[44px] sm:min-h-[40px] touch-manipulation"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <Palette className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
          <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-100">
            Chart Customization
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-800 p-3 sm:p-4 space-y-4 bg-white dark:bg-gray-900">
          {/* Color Customization */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
              <Palette className="h-4 w-4 inline mr-1" />
              Line Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => onUpdate({ lineColor: preset.value })}
                  className={`
                    w-10 h-10 rounded-md border-2 transition-all touch-manipulation active:scale-[0.95]
                    ${settings.lineColor === preset.value
                      ? 'border-gray-800 dark:border-gray-100 ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-600'
                      : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                    }
                  `}
                  style={{ backgroundColor: preset.value }}
                  aria-label={`Select ${preset.name} color`}
                  title={preset.name}
                />
              ))}
              <div className="relative">
                <input
                  type="color"
                  value={settings.lineColor}
                  onChange={(e) => onUpdate({ lineColor: e.target.value })}
                  className="w-10 h-10 rounded-md border-2 border-gray-300 cursor-pointer touch-manipulation"
                  aria-label="Custom color picker"
                />
              </div>
            </div>
          </div>

          {/* Display Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-100">
                <Grid3x3 className="h-4 w-4" />
                Show Grid
              </label>
              <button
                onClick={() => onUpdate({ showGrid: !settings.showGrid })}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  touch-manipulation active:scale-[0.95]
                  ${settings.showGrid ? 'bg-primary-600' : 'bg-gray-300'}
                `}
                aria-label={settings.showGrid ? 'Hide grid' : 'Show grid'}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.showGrid ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-100">
                <Type className="h-4 w-4" />
                Show Axis Labels
              </label>
              <button
                onClick={() => onUpdate({ showAxisLabels: !settings.showAxisLabels })}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  touch-manipulation active:scale-[0.95]
                  ${settings.showAxisLabels ? 'bg-primary-600' : 'bg-gray-300'}
                `}
                aria-label={settings.showAxisLabels ? 'Hide axis labels' : 'Show axis labels'}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.showAxisLabels ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-100">
                <Sparkles className="h-4 w-4" />
                Animation
              </label>
              <button
                onClick={() => onUpdate({ enableAnimation: !settings.enableAnimation })}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  touch-manipulation active:scale-[0.95]
                  ${settings.enableAnimation ? 'bg-primary-600' : 'bg-gray-300'}
                `}
                aria-label={settings.enableAnimation ? 'Disable animation' : 'Enable animation'}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.enableAnimation ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-3">
            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
                <Gauge className="h-4 w-4" />
                Line Width: {settings.lineWidth.toFixed(1)}px
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="0.5"
                value={settings.lineWidth}
                onChange={(e) => onUpdate({ lineWidth: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer touch-manipulation"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((settings.lineWidth - 1) / 4) * 100}%, #e5e7eb ${((settings.lineWidth - 1) / 4) * 100}%, #e5e7eb 100%)`
                }}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
                <Type className="h-4 w-4" />
                Font Size: {settings.fontSize}px
              </label>
              <input
                type="range"
                min="8"
                max="16"
                step="1"
                value={settings.fontSize}
                onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer touch-manipulation"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((settings.fontSize - 8) / 8) * 100}%, #e5e7eb ${((settings.fontSize - 8) / 8) * 100}%, #e5e7eb 100%)`
                }}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
                Chart Height: {settings.chartHeight ? `${settings.chartHeight}px` : 'Auto'}
              </label>
              <div className="flex gap-2">
                <input
                  type="range"
                  min="200"
                  max="600"
                  step="50"
                  value={settings.chartHeight || 350}
                  onChange={(e) => onUpdate({ chartHeight: parseInt(e.target.value) })}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer touch-manipulation"
                />
                <button
                  onClick={() => onUpdate({ chartHeight: null })}
                  className="px-3 py-1.5 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors touch-manipulation active:scale-[0.97]"
                >
                  Auto
                </button>
              </div>
            </div>
          </div>

          {/* Theme Selection */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
              Theme
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdate({ 
                  theme: 'light',
                  backgroundColor: '#ffffff',
                  gridColor: '#f0f0f0',
                  axisColor: '#666666'
                })}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border transition-all
                  min-h-[44px] sm:min-h-[36px] touch-manipulation active:scale-[0.97]
                  ${settings.theme === 'light'
                    ? 'bg-primary-50 border-primary-300 text-primary-700'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                `}
              >
                <Sun className="h-4 w-4" />
                <span className="text-xs sm:text-sm font-medium">Light</span>
              </button>
              <button
                onClick={() => onUpdate({ 
                  theme: 'dark',
                  backgroundColor: '#1f2937',
                  gridColor: '#374151',
                  axisColor: '#d1d5db'
                })}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border transition-all
                  min-h-[44px] sm:min-h-[36px] touch-manipulation active:scale-[0.97]
                  ${settings.theme === 'dark'
                    ? 'bg-primary-50 border-primary-300 text-primary-700'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                `}
              >
                <Moon className="h-4 w-4" />
                <span className="text-xs sm:text-sm font-medium">Dark</span>
              </button>
            </div>
          </div>

          {/* Reset Button */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={onReset}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 rounded-md transition-colors min-h-[44px] sm:min-h-[36px] touch-manipulation active:scale-[0.97]"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="text-xs sm:text-sm font-medium">Reset to Defaults</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

