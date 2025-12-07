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
} from 'recharts';
import { PriceHistory, OHLCData, TechnicalAnalysisSettings, ChartCustomizationSettings } from '@/lib/types';
import { Currency } from '@/lib/store';
import { formatCurrencyFull, CURRENCY_INFO } from '@/lib/utils/currency';
import { calculateAllIndicators, calculateAllIndicatorsOHLC } from '@/lib/utils/technicalAnalysis';

interface TechnicalIndicatorsChartProps {
  priceData?: PriceHistory[];
  ohlcData?: OHLCData[];
  height?: number;
  currency?: Currency;
  technicalAnalysis?: TechnicalAnalysisSettings;
  customization?: ChartCustomizationSettings;
}

export const TechnicalIndicatorsChart: React.FC<TechnicalIndicatorsChartProps> = ({
  priceData,
  ohlcData,
  height = 200,
  currency = 'usd',
  technicalAnalysis,
  customization,
}) => {
  const defaultHeight = customization?.chartHeight || height;
  const [chartHeight, setChartHeight] = useState(defaultHeight);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);

  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      const smallMobile = width < 400;
      const mobile = width < 640;
      setIsSmallMobile(smallMobile);
      setIsMobile(mobile);
      if (!height && !customization?.chartHeight) {
        if (smallMobile) {
          setChartHeight(150);
        } else if (mobile) {
          setChartHeight(180);
        } else {
          setChartHeight(200);
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

  // Calculate indicators
  const indicators = useMemo(() => {
    if (!technicalAnalysis || (!priceData && !ohlcData)) {
      return null;
    }

    if (ohlcData && ohlcData.length > 0) {
      const result = calculateAllIndicatorsOHLC(ohlcData);
      return {
        rsi: result.rsi,
        macd: result.macd,
      };
    } else if (priceData && priceData.length > 0) {
      const result = calculateAllIndicators(priceData);
      return {
        rsi: result.rsi,
        macd: result.macd,
      };
    }
    return null;
  }, [priceData, ohlcData, technicalAnalysis]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const sourceData = ohlcData || priceData || [];
    if (!indicators) return sourceData.map(d => ({ timestamp: d.timestamp }));

    return sourceData.map((item, index) => ({
      timestamp: item.timestamp,
      rsi: indicators.rsi[index]?.rsi,
      macd: indicators.macd[index]?.macd,
      macdSignal: indicators.macd[index]?.signal,
      macdHistogram: indicators.macd[index]?.histogram,
    }));
  }, [priceData, ohlcData, indicators]);

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

  const margins = isSmallMobile
    ? { top: 10, right: 5, left: 5, bottom: 50 }
    : isMobile
    ? { top: 10, right: 10, left: 10, bottom: 50 }
    : { top: 10, right: 20, left: 20, bottom: 40 };

  // Apply customization settings
  const gridColor = customization?.gridColor || '#f0f0f0';
  const axisColor = customization?.axisColor || '#666';
  const showGrid = customization?.showGrid !== false;
  const showAxisLabels = customization?.showAxisLabels !== false;
  const fontSize = customization?.fontSize || (isSmallMobile ? 9 : isMobile ? 10 : 12);
  const backgroundColor = customization?.backgroundColor || '#ffffff';

  const showRSI = technicalAnalysis?.showRSI;
  const showMACD = technicalAnalysis?.showMACD;

  if (!showRSI && !showMACD) {
    return null;
  }

  return (
    <div className="w-full min-w-0 overflow-hidden" style={{ height: `${chartHeight}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart 
          data={chartData} 
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
              height={isSmallMobile ? 50 : isMobile ? 40 : 30}
              interval={isSmallMobile ? 'preserveStartEnd' : isMobile ? 'preserveStartEnd' : 0}
              tick={{ fill: axisColor }}
            />
          )}
          {showRSI && showAxisLabels && (
            <>
              <YAxis
                yAxisId="rsi"
                domain={[0, 100]}
                tickFormatter={(value) => `${value}`}
                stroke="#ec4899"
                fontSize={fontSize}
                width={isSmallMobile ? 35 : isMobile ? 45 : 60}
                tick={{ fill: axisColor }}
                orientation="left"
              />
              <ReferenceLine yAxisId="rsi" y={70} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
              <ReferenceLine yAxisId="rsi" y={30} stroke="#10b981" strokeDasharray="3 3" opacity={0.5} />
              <ReferenceLine yAxisId="rsi" y={50} stroke="#9ca3af" strokeDasharray="2 2" opacity={0.3} />
              <Line
                yAxisId="rsi"
                type="monotone"
                dataKey="rsi"
                stroke="#ec4899"
                strokeWidth={customization?.lineWidth || 2}
                dot={false}
                isAnimationActive={customization?.enableAnimation !== false}
                activeDot={{ r: 4 }}
              />
            </>
          )}
          {showMACD && showAxisLabels && (
            <>
              <YAxis
                yAxisId="macd"
                tickFormatter={(value) => value.toFixed(2)}
                stroke="#10b981"
                fontSize={fontSize}
                width={isSmallMobile ? 35 : isMobile ? 45 : 60}
                tick={{ fill: axisColor }}
                orientation={showRSI ? 'right' : 'left'}
              />
              <ReferenceLine yAxisId="macd" y={0} stroke="#9ca3af" strokeDasharray="2 2" opacity={0.5} />
              <Line
                yAxisId="macd"
                type="monotone"
                dataKey="macd"
                stroke="#10b981"
                strokeWidth={customization?.lineWidth || 2}
                dot={false}
                isAnimationActive={customization?.enableAnimation !== false}
                activeDot={{ r: 4 }}
              />
              <Line
                yAxisId="macd"
                type="monotone"
                dataKey="macdSignal"
                stroke="#059669"
                strokeWidth={(customization?.lineWidth || 2) * 0.6}
                dot={false}
                strokeDasharray="3 3"
                opacity={0.8}
                isAnimationActive={customization?.enableAnimation !== false}
              />
              <Bar
                yAxisId="macd"
                dataKey="macdHistogram"
                fill="#34d399"
                opacity={0.6}
                radius={[2, 2, 0, 0]}
              />
            </>
          )}
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-2 sm:p-3 border border-gray-200 rounded-lg shadow-lg">
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">
                      {new Date(data.timestamp).toLocaleString()}
                    </p>
                    <div className="space-y-1">
                      {showRSI && !isNaN(data.rsi) && (
                        <div className="flex justify-between gap-4">
                          <span className="text-xs sm:text-sm text-gray-600">RSI:</span>
                          <span className={`text-xs sm:text-sm font-medium ${
                            data.rsi > 70 ? 'text-red-600' : data.rsi < 30 ? 'text-green-600' : 'text-pink-600'
                          }`}>
                            {data.rsi.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {showMACD && (
                        <>
                          {!isNaN(data.macd) && (
                            <div className="flex justify-between gap-4">
                              <span className="text-xs sm:text-sm text-gray-600">MACD:</span>
                              <span className="text-xs sm:text-sm font-medium text-green-600">{data.macd.toFixed(4)}</span>
                            </div>
                          )}
                          {!isNaN(data.macdSignal) && (
                            <div className="flex justify-between gap-4">
                              <span className="text-xs sm:text-sm text-gray-600">Signal:</span>
                              <span className="text-xs sm:text-sm font-medium text-green-500">{data.macdSignal.toFixed(4)}</span>
                            </div>
                          )}
                          {!isNaN(data.macdHistogram) && (
                            <div className="flex justify-between gap-4">
                              <span className="text-xs sm:text-sm text-gray-600">Histogram:</span>
                              <span className={`text-xs sm:text-sm font-medium ${
                                data.macdHistogram >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {data.macdHistogram.toFixed(4)}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            }}
            wrapperStyle={{ zIndex: 1000 }}
            allowEscapeViewBox={{ x: false, y: false }}
            offset={isMobile ? 10 : 0}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

