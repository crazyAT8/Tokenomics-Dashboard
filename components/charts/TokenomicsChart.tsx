'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TokenomicsData } from '@/lib/types';

interface TokenomicsChartProps {
  data: TokenomicsData;
}

export const TokenomicsChart: React.FC<TokenomicsChartProps> = ({ data }) => {
  const supplyData = [
    {
      name: 'Circulating Supply',
      value: data.circulating_supply,
      percentage: data.max_supply 
        ? (data.circulating_supply / data.max_supply) * 100 
        : 100,
    },
    {
      name: 'Uncirculated',
      value: data.max_supply ? data.max_supply - data.circulating_supply : 0,
      percentage: data.max_supply 
        ? ((data.max_supply - data.circulating_supply) / data.max_supply) * 100 
        : 0,
    },
  ].filter(item => item.value > 0);

  const COLORS = ['#3b82f6', '#e5e7eb'];

  const formatValue = (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return value.toFixed(2);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">
            {formatValue(data.value)} ({data.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const [isMobile, setIsMobile] = useState(false);
  const [chartHeight, setChartHeight] = useState(320);
  const [outerRadius, setOuterRadius] = useState(80);

  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      const mobile = width < 640;
      const tablet = width >= 640 && width < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setChartHeight(220);
        setOuterRadius(55);
      } else if (tablet) {
        setChartHeight(280);
        setOuterRadius(70);
      } else {
        setChartHeight(320);
        setOuterRadius(80);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <div className="w-full" style={{ height: `${chartHeight}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={supplyData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentage }) => {
              if (isMobile) {
                return `${percentage.toFixed(1)}%`;
              }
              return `${name}: ${percentage.toFixed(1)}%`;
            }}
            outerRadius={outerRadius}
            fill="#8884d8"
            dataKey="value"
          >
            {supplyData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            content={<CustomTooltip />}
            wrapperStyle={{
              zIndex: 1000,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
