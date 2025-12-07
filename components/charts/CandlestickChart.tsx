'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ReferenceLine,
} from 'recharts';
import { OHLCData } from '@/lib/types';
import { Currency } from '@/lib/store';
import { formatCurrencyFull, CURRENCY_INFO } from '@/lib/utils/currency';

interface CandlestickChartProps {
  data: OHLCData[];
  height?: number;
  currency?: Currency;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({ 
  data, 
  height, 
  currency = 'usd' 
}) => {
  const [chartHeight, setChartHeight] = useState(height || 300);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);

  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      const smallMobile = width < 400;
      const mobile = width < 640;
      const tablet = width >= 640 && width < 1024;
      setIsSmallMobile(smallMobile);
      setIsMobile(mobile);
      setIsTablet(tablet);
      if (!height) {
        if (smallMobile) {
          setChartHeight(200);
        } else if (mobile) {
          setChartHeight(240);
        } else if (tablet) {
          setChartHeight(300);
        } else {
          setChartHeight(350);
        }
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [height]);

  // Transform data for Recharts
  const chartData = useMemo(() => {
    return data.map((item) => {
      const isPositive = item.close >= item.open;
      return {
        timestamp: item.timestamp,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        isPositive,
        // For visualization - use close as main value
        value: item.close,
      };
    });
  }, [data]);

  const formatXAxis = (tickItem: number) => {
    const date = new Date(tickItem);
    if (isSmallMobile) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    if (isMobile) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatYAxis = (value: number) => {
    const info = CURRENCY_INFO[currency];
    if (isSmallMobile) {
      if (value >= 1e9) return `${info.symbol}${(value / 1e9).toFixed(1)}B`;
      if (value >= 1e6) return `${info.symbol}${(value / 1e6).toFixed(1)}M`;
      if (value >= 1e3) return `${info.symbol}${(value / 1e3).toFixed(1)}K`;
      if ((currency === 'jpy' || currency === 'krw') && value >= 1) {
        return `${info.symbol}${value.toFixed(0)}`;
      }
      return `${info.symbol}${value.toFixed(0)}`;
    }
    if (isMobile && value >= 1000) {
      return `${info.symbol}${(value / 1000).toFixed(1)}K`;
    }
    if (currency === 'jpy' || currency === 'krw') {
      return `${info.symbol}${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }
    return `${info.symbol}${value.toLocaleString()}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPositive = data.close >= data.open;
      return (
        <div className="bg-white p-2 sm:p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-xs sm:text-sm text-gray-500 mb-1">
            {new Date(data.timestamp).toLocaleString()}
          </p>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-xs sm:text-sm text-gray-600">Open:</span>
              <span className="text-xs sm:text-sm font-medium">{formatCurrencyFull(data.open, currency)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-xs sm:text-sm text-gray-600">High:</span>
              <span className="text-xs sm:text-sm font-medium text-green-600">{formatCurrencyFull(data.high, currency)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-xs sm:text-sm text-gray-600">Low:</span>
              <span className="text-xs sm:text-sm font-medium text-red-600">{formatCurrencyFull(data.low, currency)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-xs sm:text-sm text-gray-600">Close:</span>
              <span className={`text-xs sm:text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrencyFull(data.close, currency)}
              </span>
            </div>
            <div className="flex justify-between gap-4 pt-1 border-t border-gray-200">
              <span className="text-xs sm:text-sm text-gray-600">Change:</span>
              <span className={`text-xs sm:text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}{((data.close - data.open) / data.open * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const margins = isSmallMobile
    ? { top: 10, right: 5, left: 5, bottom: 50 }
    : isMobile 
    ? { top: 10, right: 10, left: 10, bottom: 50 }
    : isTablet
    ? { top: 10, right: 20, left: 20, bottom: 40 }
    : { top: 10, right: 30, left: 30, bottom: 30 };

  // Calculate min and max for domain
  const allValues = useMemo(() => data.flatMap(d => [d.high, d.low]), [data]);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const padding = (maxValue - minValue) * 0.1;

  // Render candlesticks as custom SVG overlay
  const renderCandlesticks = () => {
    if (data.length === 0) return null;
    
    // This will be rendered by a custom component that syncs with chart coordinates
    // For now, we'll use a simplified visualization
    return null;
  };

  return (
    <div 
      className="w-full min-w-0 overflow-hidden chart-container relative" 
      style={{ height: `${chartHeight}px` }}
      onTouchStart={(e) => {
        if (e.touches.length === 1) {
          e.stopPropagation();
        }
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={margins}>
          <defs>
            <clipPath id="candlestick-clip">
              <rect x="0" y="0" width="100%" height="100%" />
            </clipPath>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatXAxis}
            stroke="#666"
            fontSize={isSmallMobile ? 9 : isMobile ? 10 : 12}
            angle={isMobile ? -45 : 0}
            textAnchor={isMobile ? 'end' : 'middle'}
            height={isSmallMobile ? 70 : isMobile ? 60 : 30}
            interval={isSmallMobile ? 'preserveStartEnd' : isMobile ? 'preserveStartEnd' : 0}
            tick={{ fill: '#666' }}
          />
          <YAxis
            tickFormatter={formatYAxis}
            stroke="#666"
            fontSize={isSmallMobile ? 9 : isMobile ? 10 : 12}
            width={isSmallMobile ? 45 : isMobile ? 60 : 80}
            tick={{ fill: '#666' }}
            domain={[minValue - padding, maxValue + padding]}
          />
          <Tooltip
            content={<CustomTooltip />}
            wrapperStyle={{
              zIndex: 1000,
            }}
            allowEscapeViewBox={{ x: false, y: false }}
            offset={isMobile ? 10 : 0}
          />
          {/* High-Low range visualization */}
          <Line
            type="monotone"
            dataKey="high"
            stroke="#10b981"
            strokeWidth={1}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="low"
            stroke="#ef4444"
            strokeWidth={1}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="close"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
          />
          {renderCandlesticks()}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
