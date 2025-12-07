/**
 * Technical Analysis Utilities
 * Provides functions for calculating common technical indicators
 */

export interface TechnicalIndicator {
  timestamp: number;
  value: number;
}

export interface MovingAverageData extends TechnicalIndicator {
  sma?: number;
  ema?: number;
}

export interface RSIData extends TechnicalIndicator {
  rsi: number;
}

export interface MACDData extends TechnicalIndicator {
  macd: number;
  signal: number;
  histogram: number;
}

export interface BollingerBandsData extends TechnicalIndicator {
  upper: number;
  middle: number;
  lower: number;
}

/**
 * Simple Moving Average (SMA)
 */
export function calculateSMA(
  data: { timestamp: number; value: number }[],
  period: number
): number[] {
  const sma: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
    } else {
      const sum = data
        .slice(i - period + 1, i + 1)
        .reduce((acc, item) => acc + item.value, 0);
      sma.push(sum / period);
    }
  }
  
  return sma;
}

/**
 * Exponential Moving Average (EMA)
 */
export function calculateEMA(
  data: { timestamp: number; value: number }[],
  period: number
): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      ema.push(data[i].value);
    } else if (i < period - 1) {
      // Use SMA for initial values
      const sum = data
        .slice(0, i + 1)
        .reduce((acc, item) => acc + item.value, 0);
      ema.push(sum / (i + 1));
    } else {
      const prevEMA = ema[i - 1];
      const currentValue = data[i].value;
      ema.push((currentValue - prevEMA) * multiplier + prevEMA);
    }
  }
  
  return ema;
}

/**
 * Relative Strength Index (RSI)
 */
export function calculateRSI(
  data: { timestamp: number; value: number }[],
  period: number = 14
): RSIData[] {
  const rsiData: RSIData[] = [];
  
  if (data.length < period + 1) {
    return data.map(item => ({ ...item, rsi: NaN }));
  }
  
  // Calculate price changes
  const changes: number[] = [];
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i].value - data[i - 1].value);
  }
  
  // Calculate initial average gain and loss
  let avgGain = 0;
  let avgLoss = 0;
  
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) {
      avgGain += changes[i];
    } else {
      avgLoss += Math.abs(changes[i]);
    }
  }
  
  avgGain /= period;
  avgLoss /= period;
  
  // First RSI value
  for (let i = 0; i < period; i++) {
    rsiData.push({ ...data[i], rsi: NaN });
  }
  
  // Calculate RSI for remaining values
  for (let i = period; i < data.length; i++) {
    const change = changes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    
    // Use Wilder's smoothing method
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    rsiData.push({ ...data[i], rsi });
  }
  
  return rsiData;
}

/**
 * MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(
  data: { timestamp: number; value: number }[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDData[] {
  const macdData: MACDData[] = [];
  
  if (data.length < slowPeriod) {
    return data.map(item => ({ ...item, macd: NaN, signal: NaN, histogram: NaN }));
  }
  
  // Calculate EMAs
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);
  
  // Calculate MACD line
  const macdLine: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
      macdLine.push(NaN);
    } else {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }
  }
  
  // Convert MACD line to format for signal calculation
  const macdLineData = macdLine
    .map((value, index) => ({
      timestamp: data[index].timestamp,
      value: isNaN(value) ? 0 : value,
    }))
    .filter((_, index) => !isNaN(macdLine[index]));
  
  // Calculate signal line (EMA of MACD line)
  const signalLine = calculateEMA(macdLineData, signalPeriod);
  
  // Create MACD data
  let signalIndex = 0;
  for (let i = 0; i < data.length; i++) {
    if (isNaN(macdLine[i])) {
      macdData.push({
        ...data[i],
        macd: NaN,
        signal: NaN,
        histogram: NaN,
      });
    } else {
      const macd = macdLine[i];
      const signal = signalIndex < signalLine.length ? signalLine[signalIndex] : NaN;
      const histogram = isNaN(signal) ? NaN : macd - signal;
      
      macdData.push({
        ...data[i],
        macd,
        signal,
        histogram,
      });
      
      if (!isNaN(signal)) {
        signalIndex++;
      }
    }
  }
  
  return macdData;
}

/**
 * Bollinger Bands
 */
export function calculateBollingerBands(
  data: { timestamp: number; value: number }[],
  period: number = 20,
  stdDev: number = 2
): BollingerBandsData[] {
  const bands: BollingerBandsData[] = [];
  
  if (data.length < period) {
    return data.map(item => ({
      ...item,
      upper: NaN,
      middle: NaN,
      lower: NaN,
    }));
  }
  
  // Calculate SMA (middle band)
  const sma = calculateSMA(data, period);
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      bands.push({
        ...data[i],
        upper: NaN,
        middle: NaN,
        lower: NaN,
      });
    } else {
      const middle = sma[i];
      
      // Calculate standard deviation
      const slice = data.slice(i - period + 1, i + 1);
      const mean = middle;
      const variance = slice.reduce((acc, item) => {
        return acc + Math.pow(item.value - mean, 2);
      }, 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      const upper = middle + (standardDeviation * stdDev);
      const lower = middle - (standardDeviation * stdDev);
      
      bands.push({
        ...data[i],
        upper,
        middle,
        lower,
      });
    }
  }
  
  return bands;
}

/**
 * Calculate support and resistance levels
 */
export function calculateSupportResistance(
  data: { timestamp: number; high: number; low: number; close: number }[],
  lookback: number = 20
): { support: number; resistance: number } {
  if (data.length < lookback) {
    const prices = data.map(d => d.close);
    return {
      support: Math.min(...prices),
      resistance: Math.max(...prices),
    };
  }
  
  const recentData = data.slice(-lookback);
  const lows = recentData.map(d => d.low);
  const highs = recentData.map(d => d.high);
  
  // Find local minima and maxima
  const support = Math.min(...lows);
  const resistance = Math.max(...highs);
  
  return { support, resistance };
}

/**
 * Calculate all technical indicators for price data
 */
export function calculateAllIndicators(
  priceData: { timestamp: number; price: number }[]
) {
  const data = priceData.map(d => ({ timestamp: d.timestamp, value: d.price }));
  
  return {
    sma20: calculateSMA(data, 20),
    sma50: calculateSMA(data, 50),
    sma200: calculateSMA(data, 200),
    ema20: calculateEMA(data, 20),
    ema50: calculateEMA(data, 50),
    rsi: calculateRSI(data, 14),
    macd: calculateMACD(data, 12, 26, 9),
    bollinger: calculateBollingerBands(data, 20, 2),
  };
}

/**
 * Calculate all technical indicators for OHLC data
 */
export function calculateAllIndicatorsOHLC(
  ohlcData: { timestamp: number; open: number; high: number; low: number; close: number }[]
) {
  const closeData = ohlcData.map(d => ({ timestamp: d.timestamp, value: d.close }));
  
  return {
    sma20: calculateSMA(closeData, 20),
    sma50: calculateSMA(closeData, 50),
    sma200: calculateSMA(closeData, 200),
    ema20: calculateEMA(closeData, 20),
    ema50: calculateEMA(closeData, 50),
    rsi: calculateRSI(closeData, 14),
    macd: calculateMACD(closeData, 12, 26, 9),
    bollinger: calculateBollingerBands(closeData, 20, 2),
    supportResistance: calculateSupportResistance(ohlcData, 20),
  };
}

