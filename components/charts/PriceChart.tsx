'use client';

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { PriceHistory } from '@/lib/types';
import { Currency } from '@/lib/store';
import { formatCurrency, formatCurrencyFull, CURRENCY_INFO } from '@/lib/utils/currency';

interface PriceChartProps {
  data: PriceHistory[];
  height?: number;
  currency?: Currency;
}

export const PriceChart: React.FC<PriceChartProps> = ({ data, height, currency = 'usd' }) => {
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
        // Dynamic height based on screen size
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
      // For JPY and KRW, don't show decimals for whole numbers
      if ((currency === 'jpy' || currency === 'krw') && value >= 1) {
        return `${info.symbol}${value.toFixed(0)}`;
      }
      return `${info.symbol}${value.toFixed(0)}`;
    }
    if (isMobile && value >= 1000) {
      return `${info.symbol}${(value / 1000).toFixed(1)}K`;
    }
    // For JPY and KRW, don't show decimals
    if (currency === 'jpy' || currency === 'krw') {
      return `${info.symbol}${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }
    return `${info.symbol}${value.toLocaleString()}`;
  };

  const formatTooltip = (value: number, name: string) => {
    return [formatCurrencyFull(value, currency), 'Price'];
  };

  // Adjust margins for different screen sizes
  const margins = isSmallMobile
    ? { top: 10, right: 5, left: 5, bottom: 50 }
    : isMobile 
    ? { top: 10, right: 10, left: 10, bottom: 50 }
    : isTablet
    ? { top: 10, right: 20, left: 20, bottom: 40 }
    : { top: 10, right: 30, left: 30, bottom: 30 };

  return (
    <div 
      className="w-full min-w-0 overflow-hidden chart-container" 
      style={{ height: `${chartHeight}px` }}
      onTouchStart={(e) => {
        // Prevent page scroll when interacting with chart
        if (e.touches.length === 1) {
          e.stopPropagation();
        }
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={margins}>
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
            domain={['auto', 'auto']}
          />
          <Tooltip
            formatter={formatTooltip}
            labelFormatter={(label) => new Date(label).toLocaleString()}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              fontSize: isSmallMobile ? '11px' : isMobile ? '12px' : '14px',
              padding: isSmallMobile ? '8px' : isMobile ? '10px' : '12px',
              maxWidth: isMobile ? '200px' : 'none',
              pointerEvents: 'none',
            }}
            wrapperStyle={{
              zIndex: 1000,
            }}
            position={{ x: undefined, y: undefined }}
            // Better touch interaction
            allowEscapeViewBox={{ x: false, y: false }}
            // Prevent tooltip from being cut off on mobile
            offset={isMobile ? 10 : 0}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#3b82f6"
            strokeWidth={isSmallMobile ? 1.5 : isMobile ? 2 : 2.5}
            dot={false}
            activeDot={{ 
              r: isSmallMobile ? 4 : isMobile ? 5 : 6, 
              fill: '#3b82f6', 
              strokeWidth: 2, 
              stroke: '#fff' 
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
