'use client';

import React from 'react';
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

export const PriceChart: React.FC<PriceChartProps> = ({ data, height = 300 }) => {
  const formatXAxis = (tickItem: number) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTooltip = (value: number, name: string) => {
    return [`$${value.toLocaleString()}`, 'Price'];
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={formatXAxis}
          stroke="#666"
          fontSize={12}
        />
        <YAxis
          tickFormatter={(value) => `$${value.toLocaleString()}`}
          stroke="#666"
          fontSize={12}
        />
        <Tooltip
          formatter={formatTooltip}
          labelFormatter={(label) => new Date(label).toLocaleString()}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#3b82f6' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
