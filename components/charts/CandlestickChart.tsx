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
  Bar,
  ReferenceLine,
  Cell,
} from 'recharts';
import { OHLCData, TechnicalAnalysisSettings, ChartCustomizationSettings } from '@/lib/types';
import { Currency } from '@/lib/store';
import { formatCurrencyFull, CURRENCY_INFO } from '@/lib/utils/currency';
import { calculateAllIndicatorsOHLC } from '@/lib/utils/technicalAnalysis';
import { Area } from 'recharts';

interface CandlestickChartProps {
  data: OHLCData[];
  height?: number;
  currency?: Currency;
  technicalAnalysis?: TechnicalAnalysisSettings;
  customization?: ChartCustomizationSettings;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({ 
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
    return calculateAllIndicatorsOHLC(data);
  }, [data, technicalAnalysis]);

  // Transform data for Recharts with volume indicators and technical analysis
  const chartData = useMemo(() => {
    return data.map((item, index) => {
      const isPositive = item.close >= item.open;
      const baseData = {
        timestamp: item.timestamp,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        isPositive,
        volume: item.volume || 0,
        value: item.close,
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

  // Calculate volume moving average (20-period)
  const volumeWithMA = useMemo(() => {
    const period = 20;
    return chartData.map((item, index) => {
      if (index < period - 1) {
        return { ...item, volumeMA: item.volume };
      }
      const sum = chartData
        .slice(index - period + 1, index + 1)
        .reduce((acc, d) => acc + (d.volume || 0), 0);
      return { ...item, volumeMA: sum / period };
    });
  }, [chartData]);

  // Calculate domain with technical indicators
  const priceDomain = useMemo(() => {
    const allValues = data.flatMap(d => [d.high, d.low]);
    
    if (indicators && technicalAnalysis?.showBollingerBands) {
      const bbValues = indicators.bollinger
        .flatMap(b => [b.upper, b.lower])
        .filter(v => !isNaN(v));
      allValues.push(...bbValues);
    }
    
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const padding = (maxValue - minValue) * 0.1;
    return [minValue - padding, maxValue + padding];
  }, [data, indicators, technicalAnalysis]);

  // Calculate volume statistics for scaling
  const volumeStats = useMemo(() => {
    const volumes = chartData.map(d => d.volume || 0).filter(v => v > 0);
    if (volumes.length === 0) return { max: 0, min: 0 };
    return {
      max: Math.max(...volumes),
      min: Math.min(...volumes),
    };
  }, [chartData]);

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

  const formatVolumeAxis = (value: number) => {
    if (value === 0) return '0';
    if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return value.toFixed(0);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPositive = data.close >= data.open;
      const hasVolume = data.volume !== undefined && data.volume > 0;
      const hasIndicators = technicalAnalysis && indicators;
      
      return (
        <div className="bg-white p-2 sm:p-3 border border-gray-200 rounded-lg shadow-lg max-w-xs">
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
            {hasVolume && (
              <>
                <div className="flex justify-between gap-4 pt-1 border-t border-gray-200">
                  <span className="text-xs sm:text-sm text-gray-600">Volume:</span>
                  <span className="text-xs sm:text-sm font-medium">{formatVolumeAxis(data.volume)}</span>
                </div>
                {data.volumeMA !== undefined && (
                  <div className="flex justify-between gap-4">
                    <span className="text-xs sm:text-sm text-gray-600">Vol MA(20):</span>
                    <span className="text-xs sm:text-sm font-medium text-gray-500">{formatVolumeAxis(data.volumeMA)}</span>
                  </div>
                )}
              </>
            )}
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

  const margins = isSmallMobile
    ? { top: 10, right: 5, left: 5, bottom: 80 }
    : isMobile 
    ? { top: 10, right: 10, left: 10, bottom: 80 }
    : isTablet
    ? { top: 10, right: 20, left: 20, bottom: 70 }
    : { top: 10, right: 30, left: 30, bottom: 60 };

  // Apply customization settings
  const isDark = customization?.theme === 'dark' || (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));
  const lineColor = customization?.lineColor || '#3b82f6';
  const gridColor = customization?.gridColor || (isDark ? '#1f2937' : '#f0f0f0');
  const axisColor = customization?.axisColor || (isDark ? '#e5e7eb' : '#666');
  const showGrid = customization?.showGrid !== false;
  const showAxisLabels = customization?.showAxisLabels !== false;
  const fontSize = customization?.fontSize || (isSmallMobile ? 9 : isMobile ? 10 : 12);
  const lineWidth = customization?.lineWidth || 2;
  const backgroundColor = customization?.backgroundColor || (isDark ? '#0f172a' : '#ffffff');


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
        <ComposedChart 
          data={volumeWithMA} 
          margin={margins}
          style={{ backgroundColor }}
        >
          <defs>
            <clipPath id="candlestick-clip">
              <rect x="0" y="0" width="100%" height="100%" />
            </clipPath>
          </defs>
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
            <>
              <YAxis
                yAxisId="price"
                tickFormatter={formatYAxis}
                stroke={axisColor}
                fontSize={fontSize}
                width={isSmallMobile ? 45 : isMobile ? 60 : 80}
                tick={{ fill: axisColor }}
                domain={priceDomain}
                orientation="left"
              />
              <YAxis
                yAxisId="volume"
                tickFormatter={formatVolumeAxis}
                stroke={axisColor}
                fontSize={fontSize - 2}
                width={isSmallMobile ? 35 : isMobile ? 45 : 60}
                tick={{ fill: axisColor }}
                orientation="right"
                domain={[0, volumeStats.max * 1.1]}
              />
            </>
          )}
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
            yAxisId="price"
            type="monotone"
            dataKey="high"
            stroke="#10b981"
            strokeWidth={1}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="low"
            stroke="#ef4444"
            strokeWidth={1}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="close"
            stroke={lineColor}
            strokeWidth={lineWidth}
            dot={false}
            isAnimationActive={customization?.enableAnimation !== false}
            activeDot={{ r: 5, fill: lineColor }}
          />
          {/* Technical Indicators */}
          {technicalAnalysis?.showSMA20 && (
            <Line
              yAxisId="price"
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
              yAxisId="price"
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
              yAxisId="price"
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
              yAxisId="price"
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
              yAxisId="price"
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
                yAxisId="price"
                type="monotone"
                dataKey="bbUpper"
                stroke="none"
                fill="#f97316"
                fillOpacity={0.1}
                connectNulls={false}
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="bbUpper"
                stroke="#f97316"
                strokeWidth={1}
                dot={false}
                opacity={0.6}
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="bbMiddle"
                stroke="#fb923c"
                strokeWidth={1}
                dot={false}
                strokeDasharray="2 2"
                opacity={0.6}
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="bbLower"
                stroke="#f97316"
                strokeWidth={1}
                dot={false}
                opacity={0.6}
              />
            </>
          )}
          {technicalAnalysis?.showSupportResistance && indicators && (
            <>
              <ReferenceLine
                yAxisId="price"
                y={indicators.supportResistance.support}
                stroke="#eab308"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                opacity={0.7}
                label={{ value: 'Support', position: 'right', fill: '#eab308', fontSize: 10 }}
              />
              <ReferenceLine
                yAxisId="price"
                y={indicators.supportResistance.resistance}
                stroke="#eab308"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                opacity={0.7}
                label={{ value: 'Resistance', position: 'right', fill: '#eab308', fontSize: 10 }}
              />
            </>
          )}
          {/* Volume bars with color coding */}
          {volumeStats.max > 0 && (
            <>
              <Bar
                yAxisId="volume"
                dataKey="volume"
                fill="#8884d8"
                opacity={0.6}
                radius={[2, 2, 0, 0]}
              >
                {volumeWithMA.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isPositive ? '#10b981' : '#ef4444'}
                    opacity={0.5}
                  />
                ))}
              </Bar>
              {/* Volume Moving Average Line */}
              <Line
                yAxisId="volume"
                type="monotone"
                dataKey="volumeMA"
                stroke="#6366f1"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="5 5"
                opacity={0.7}
              />
            </>
          )}
          {renderCandlesticks()}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
