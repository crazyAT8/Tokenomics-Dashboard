import { Currency } from '@/lib/store';

export const CURRENCY_INFO: Record<Currency, { symbol: string; name: string; code: string }> = {
  usd: { symbol: '$', name: 'US Dollar', code: 'USD' },
  eur: { symbol: '€', name: 'Euro', code: 'EUR' },
  gbp: { symbol: '£', name: 'British Pound', code: 'GBP' },
  jpy: { symbol: '¥', name: 'Japanese Yen', code: 'JPY' },
  cad: { symbol: 'C$', name: 'Canadian Dollar', code: 'CAD' },
  aud: { symbol: 'A$', name: 'Australian Dollar', code: 'AUD' },
  chf: { symbol: 'CHF', name: 'Swiss Franc', code: 'CHF' },
  cny: { symbol: '¥', name: 'Chinese Yuan', code: 'CNY' },
  inr: { symbol: '₹', name: 'Indian Rupee', code: 'INR' },
  krw: { symbol: '₩', name: 'South Korean Won', code: 'KRW' },
};

export const formatCurrency = (value: number, currency: Currency): string => {
  const info = CURRENCY_INFO[currency];
  const isWholeNumber = value >= 1 && value % 1 === 0;
  
  // For JPY and KRW, don't show decimals for whole numbers
  if ((currency === 'jpy' || currency === 'krw') && isWholeNumber) {
    return `${info.symbol}${value.toLocaleString()}`;
  }
  
  if (value >= 1e9) return `${info.symbol}${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${info.symbol}${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${info.symbol}${(value / 1e3).toFixed(2)}K`;
  
  // For small values, show more precision
  if (value < 1) {
    return `${info.symbol}${value.toFixed(4)}`;
  }
  
  return `${info.symbol}${value.toFixed(2)}`;
};

export const formatCurrencyCompact = (value: number, currency: Currency): string => {
  const info = CURRENCY_INFO[currency];
  
  if (value >= 1e9) return `${info.symbol}${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${info.symbol}${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${info.symbol}${(value / 1e3).toFixed(1)}K`;
  
  // For JPY and KRW, don't show decimals for whole numbers
  if (currency === 'jpy' || currency === 'krw') {
    return `${info.symbol}${value.toFixed(0)}`;
  }
  
  return `${info.symbol}${value.toFixed(0)}`;
};

export const formatCurrencyFull = (value: number, currency: Currency): string => {
  const info = CURRENCY_INFO[currency];
  
  // For JPY and KRW, don't show decimals
  if (currency === 'jpy' || currency === 'krw') {
    return `${info.symbol}${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }
  
  return `${info.symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

