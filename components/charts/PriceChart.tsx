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

interface PriceChartProps {
  data: PriceHistory[];
  height?: number;
}

export const PriceChart: React.FC<PriceChartProps> = ({ data, height }) => {
  const [chartHeight, setChartHeight] = useState(height || 300);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateDimensions = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      if (!height) {
        // Dynamic height based on screen size
        if (mobile) {
          setChartHeight(250);
        } else if (window.innerWidth < 1024) {
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
    if (isMobile) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatTooltip = (value: number, name: string) => {
    return [`$${value.toLocaleString()}`, 'Price'];
  };

  // Adjust margins for mobile
  const margins = isMobile 
    ? { top: 5, right: 10, left: 0, bottom: 20 }
    : { top: 5, right: 30, left: 20, bottom: 5 };

  return (
    <div className="w-full" style={{ height: `${chartHeight}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={margins}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatXAxis}
            stroke="#666"
            fontSize={isMobile ? 10 : 12}
            angle={isMobile ? -45 : 0}
            textAnchor={isMobile ? 'end' : 'middle'}
            height={isMobile ? 60 : 30}
            interval={isMobile ? 'preserveStartEnd' : 0}
          />
          <YAxis
            tickFormatter={(value) => {
              if (isMobile && value >= 1000) {
                return `$${(value / 1000).toFixed(1)}K`;
              }
              return `$${value.toLocaleString()}`;
            }}
            stroke="#666"
            fontSize={isMobile ? 10 : 12}
            width={isMobile ? 50 : 80}
          />
          <Tooltip
            formatter={formatTooltip}
            labelFormatter={(label) => new Date(label).toLocaleString()}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              fontSize: isMobile ? '12px' : '14px',
              padding: isMobile ? '8px' : '12px',
            }}
            wrapperStyle={{
              zIndex: 1000,
            }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#3b82f6"
            strokeWidth={isMobile ? 1.5 : 2}
            dot={false}
            activeDot={{ r: isMobile ? 5 : 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
