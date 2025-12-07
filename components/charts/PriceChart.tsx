'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { PriceHistory, TechnicalAnalysisSettings, ChartCustomizationSettings } from '@/lib/types';
import { Currency } from '@/lib/store';
import { formatCurrency, formatCurrencyFull, CURRENCY_INFO } from '@/lib/utils/currency';
import { calculateAllIndicators } from '@/lib/utils/technicalAnalysis';
import { Area } from 'recharts';

interface PriceChartProps {
  data: PriceHistory[];
  height?: number;
  currency?: Currency;
  technicalAnalysis?: TechnicalAnalysisSettings;
  customization?: ChartCustomizationSettings;
}

export const PriceChart: React.FC<PriceChartProps> = ({ 
  data, 
  height, 
  currency = 'usd',
  technicalAnalysis,
  customization
}) => {
  const defaultHeight = customization?.chartHeight || height || 300;
  const [chartHeight, setChartHeight] = useState(defaultHeight);
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
      if (!height && !customization?.chartHeight) {
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
      } else if (customization?.chartHeight) {
        setChartHeight(customization.chartHeight);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [height, customization?.chartHeight]);

  // Update chart height when customization changes
  useEffect(() => {
    if (customization?.chartHeight) {
      setChartHeight(customization.chartHeight);
    }
  }, [customization?.chartHeight]);

  // Calculate technical indicators
  const indicators = useMemo(() => {
    if (!technicalAnalysis || data.length === 0) {
      return null;
    }
    return calculateAllIndicators(data);
  }, [data, technicalAnalysis]);

  // Transform data with technical indicators
  const chartDataWithIndicators = useMemo(() => {
    return data.map((item, index) => {
      const baseData = {
        timestamp: item.timestamp,
        price: item.price,
      };

      if (!indicators) return baseData;

      return {
        ...baseData,
        sma20: indicators.sma20[index],
        sma50: indicators.sma50[index],
        sma200: indicators.sma200[index],
        ema20: indicators.ema20[index],
        ema50: indicators.ema50[index],
        rsi: indicators.rsi[index]?.rsi,
        macd: indicators.macd[index]?.macd,
        macdSignal: indicators.macd[index]?.signal,
        macdHistogram: indicators.macd[index]?.histogram,
        bbUpper: indicators.bollinger[index]?.upper,
        bbMiddle: indicators.bollinger[index]?.middle,
        bbLower: indicators.bollinger[index]?.lower,
      };
    });
  }, [data, indicators]);

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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const hasIndicators = technicalAnalysis && indicators;
      
      return (
        <div className="bg-white p-2 sm:p-3 border border-gray-200 rounded-lg shadow-lg max-w-xs">
          <p className="text-xs sm:text-sm text-gray-500 mb-1">
            {new Date(data.timestamp).toLocaleString()}
          </p>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-xs sm:text-sm text-gray-600">Price:</span>
              <span className="text-xs sm:text-sm font-medium">{formatCurrencyFull(data.price, currency)}</span>
            </div>
            {hasIndicators && (
              <div className="pt-1 border-t border-gray-200 space-y-1">
                {technicalAnalysis.showSMA20 && !isNaN(data.sma20) && (
                  <div className="flex justify-between gap-4">
                    <span className="text-xs sm:text-sm text-gray-600">SMA 20:</span>
                    <span className="text-xs sm:text-sm font-medium text-blue-600">{formatCurrencyFull(data.sma20, currency)}</span>
                  </div>
                )}
                {technicalAnalysis.showSMA50 && !isNaN(data.sma50) && (
                  <div className="flex justify-between gap-4">
                    <span className="text-xs sm:text-sm text-gray-600">SMA 50:</span>
                    <span className="text-xs sm:text-sm font-medium text-purple-600">{formatCurrencyFull(data.sma50, currency)}</span>
                  </div>
                )}
                {technicalAnalysis.showSMA200 && !isNaN(data.sma200) && (
                  <div className="flex justify-between gap-4">
                    <span className="text-xs sm:text-sm text-gray-600">SMA 200:</span>
                    <span className="text-xs sm:text-sm font-medium text-indigo-600">{formatCurrencyFull(data.sma200, currency)}</span>
                  </div>
                )}
                {technicalAnalysis.showEMA20 && !isNaN(data.ema20) && (
                  <div className="flex justify-between gap-4">
                    <span className="text-xs sm:text-sm text-gray-600">EMA 20:</span>
                    <span className="text-xs sm:text-sm font-medium text-cyan-600">{formatCurrencyFull(data.ema20, currency)}</span>
                  </div>
                )}
                {technicalAnalysis.showEMA50 && !isNaN(data.ema50) && (
                  <div className="flex justify-between gap-4">
                    <span className="text-xs sm:text-sm text-gray-600">EMA 50:</span>
                    <span className="text-xs sm:text-sm font-medium text-teal-600">{formatCurrencyFull(data.ema50, currency)}</span>
                  </div>
                )}
                {technicalAnalysis.showBollingerBands && !isNaN(data.bbUpper) && (
                  <>
                    <div className="flex justify-between gap-4">
                      <span className="text-xs sm:text-sm text-gray-600">BB Upper:</span>
                      <span className="text-xs sm:text-sm font-medium text-orange-600">{formatCurrencyFull(data.bbUpper, currency)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-xs sm:text-sm text-gray-600">BB Middle:</span>
                      <span className="text-xs sm:text-sm font-medium text-orange-500">{formatCurrencyFull(data.bbMiddle, currency)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-xs sm:text-sm text-gray-600">BB Lower:</span>
                      <span className="text-xs sm:text-sm font-medium text-orange-600">{formatCurrencyFull(data.bbLower, currency)}</span>
                    </div>
                  </>
                )}
                {technicalAnalysis.showRSI && !isNaN(data.rsi) && (
                  <div className="flex justify-between gap-4">
                    <span className="text-xs sm:text-sm text-gray-600">RSI:</span>
                    <span className={`text-xs sm:text-sm font-medium ${
                      data.rsi > 70 ? 'text-red-600' : data.rsi < 30 ? 'text-green-600' : 'text-pink-600'
                    }`}>
                      {data.rsi.toFixed(2)}
                    </span>
                  </div>
                )}
                {technicalAnalysis.showMACD && !isNaN(data.macd) && (
                  <>
                    <div className="flex justify-between gap-4">
                      <span className="text-xs sm:text-sm text-gray-600">MACD:</span>
                      <span className="text-xs sm:text-sm font-medium text-green-600">{data.macd.toFixed(4)}</span>
                    </div>
                    {!isNaN(data.macdSignal) && (
                      <div className="flex justify-between gap-4">
                        <span className="text-xs sm:text-sm text-gray-600">Signal:</span>
                        <span className="text-xs sm:text-sm font-medium text-green-500">{data.macdSignal.toFixed(4)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Adjust margins for different screen sizes
  const margins = isSmallMobile
    ? { top: 10, right: 5, left: 5, bottom: 50 }
    : isMobile 
    ? { top: 10, right: 10, left: 10, bottom: 50 }
    : isTablet
    ? { top: 10, right: 20, left: 20, bottom: 40 }
    : { top: 10, right: 30, left: 30, bottom: 30 };

  // Apply customization settings
  const lineColor = customization?.lineColor || '#3b82f6';
  const gridColor = customization?.gridColor || '#f0f0f0';
  const axisColor = customization?.axisColor || '#666';
  const showGrid = customization?.showGrid !== false;
  const showAxisLabels = customization?.showAxisLabels !== false;
  const fontSize = customization?.fontSize || (isSmallMobile ? 9 : isMobile ? 10 : 12);
  const lineWidth = customization?.lineWidth || (isSmallMobile ? 1.5 : isMobile ? 2 : 2.5);
  const backgroundColor = customization?.backgroundColor || '#ffffff';

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
        <LineChart 
          data={chartDataWithIndicators} 
          margin={margins}
          style={{ backgroundColor }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />}
          {showAxisLabels && (
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              stroke={axisColor}
              fontSize={fontSize}
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              height={isSmallMobile ? 70 : isMobile ? 60 : 30}
              interval={isSmallMobile ? 'preserveStartEnd' : isMobile ? 'preserveStartEnd' : 0}
              tick={{ fill: axisColor }}
            />
          )}
          {showAxisLabels && (
            <YAxis
              tickFormatter={formatYAxis}
              stroke={axisColor}
              fontSize={fontSize}
              width={isSmallMobile ? 45 : isMobile ? 60 : 80}
              tick={{ fill: axisColor }}
              domain={['auto', 'auto']}
            />
          )}
          <Tooltip
            content={<CustomTooltip />}
            wrapperStyle={{
              zIndex: 1000,
            }}
            allowEscapeViewBox={{ x: false, y: false }}
            offset={isMobile ? 10 : 0}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke={lineColor}
            strokeWidth={lineWidth}
            dot={false}
            isAnimationActive={customization?.enableAnimation !== false}
            activeDot={{ 
              r: isSmallMobile ? 4 : isMobile ? 5 : 6, 
              fill: lineColor, 
              strokeWidth: 2, 
              stroke: '#fff' 
            }}
          />
          {/* Technical Indicators */}
          {technicalAnalysis?.showSMA20 && (
            <Line
              type="monotone"
              dataKey="sma20"
              stroke="#2563eb"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="3 3"
              opacity={0.8}
            />
          )}
          {technicalAnalysis?.showSMA50 && (
            <Line
              type="monotone"
              dataKey="sma50"
              stroke="#7c3aed"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="3 3"
              opacity={0.8}
            />
          )}
          {technicalAnalysis?.showSMA200 && (
            <Line
              type="monotone"
              dataKey="sma200"
              stroke="#4f46e5"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="3 3"
              opacity={0.8}
            />
          )}
          {technicalAnalysis?.showEMA20 && (
            <Line
              type="monotone"
              dataKey="ema20"
              stroke="#06b6d4"
              strokeWidth={1.5}
              dot={false}
              opacity={0.8}
            />
          )}
          {technicalAnalysis?.showEMA50 && (
            <Line
              type="monotone"
              dataKey="ema50"
              stroke="#14b8a6"
              strokeWidth={1.5}
              dot={false}
              opacity={0.8}
            />
          )}
          {technicalAnalysis?.showBollingerBands && (
            <>
              <Area
                type="monotone"
                dataKey="bbUpper"
                stroke="none"
                fill="#f97316"
                fillOpacity={0.1}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="bbUpper"
                stroke="#f97316"
                strokeWidth={1}
                dot={false}
                opacity={0.6}
              />
              <Line
                type="monotone"
                dataKey="bbMiddle"
                stroke="#fb923c"
                strokeWidth={1}
                dot={false}
                strokeDasharray="2 2"
                opacity={0.6}
              />
              <Line
                type="monotone"
                dataKey="bbLower"
                stroke="#f97316"
                strokeWidth={1}
                dot={false}
                opacity={0.6}
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
