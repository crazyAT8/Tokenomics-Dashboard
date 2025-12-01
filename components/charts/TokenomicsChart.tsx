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
        <div className="bg-white p-2 sm:p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-xs sm:text-sm">{data.name}</p>
          <p className="text-xs sm:text-sm text-gray-600">
            {formatValue(data.value)} ({data.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [chartHeight, setChartHeight] = useState(320);
  const [outerRadius, setOuterRadius] = useState(80);
  const [labelFontSize, setLabelFontSize] = useState(12);

  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      const smallMobile = width < 400;
      const mobile = width < 640;
      const tablet = width >= 640 && width < 1024;
      setIsSmallMobile(smallMobile);
      setIsMobile(mobile);
      setIsTablet(tablet);
      
      if (smallMobile) {
        setChartHeight(200);
        setOuterRadius(45);
        setLabelFontSize(9);
      } else if (mobile) {
        setChartHeight(240);
        setOuterRadius(60);
        setLabelFontSize(10);
      } else if (tablet) {
        setChartHeight(300);
        setOuterRadius(75);
        setLabelFontSize(11);
      } else {
        setChartHeight(320);
        setOuterRadius(85);
        setLabelFontSize(12);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <div className="w-full min-w-0 overflow-hidden" style={{ height: `${chartHeight}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={supplyData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentage }) => {
              if (isSmallMobile) {
                return `${percentage.toFixed(0)}%`;
              }
              if (isMobile) {
                return `${percentage.toFixed(1)}%`;
              }
              return `${name}: ${percentage.toFixed(1)}%`;
            }}
            outerRadius={outerRadius}
            innerRadius={isSmallMobile ? outerRadius * 0.3 : isMobile ? outerRadius * 0.35 : outerRadius * 0.4}
            fill="#8884d8"
            dataKey="value"
            style={{
              fontSize: `${labelFontSize}px`,
            }}
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
