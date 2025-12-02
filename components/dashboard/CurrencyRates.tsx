'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Currency } from '@/lib/store';
import { CURRENCY_INFO } from '@/lib/utils/currency';
import { ExchangeRates } from '@/lib/types';
import { RefreshCw } from 'lucide-react';

interface CurrencyRatesProps {
  exchangeRates: ExchangeRates | null;
  baseCurrency: Currency;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const CURRENCY_CODES: Record<Currency, string> = {
  usd: 'USD',
  eur: 'EUR',
  gbp: 'GBP',
  jpy: 'JPY',
  cad: 'CAD',
  aud: 'AUD',
  chf: 'CHF',
  cny: 'CNY',
  inr: 'INR',
  krw: 'KRW',
};

const DISPLAY_CURRENCIES: Currency[] = ['usd', 'eur', 'gbp', 'jpy', 'cad', 'aud', 'chf', 'cny', 'inr', 'krw'];

export const CurrencyRates: React.FC<CurrencyRatesProps> = ({
  exchangeRates,
  baseCurrency,
  isLoading = false,
  onRefresh,
}) => {
  if (!exchangeRates) {
    return null;
  }

  const baseCode = CURRENCY_CODES[baseCurrency];
  const baseInfo = CURRENCY_INFO[baseCurrency];

  // Get rates for currencies we want to display, excluding the base currency
  const ratesToShow = DISPLAY_CURRENCIES
    .filter((currency) => currency !== baseCurrency)
    .map((currency) => {
      const code = CURRENCY_CODES[currency];
      const rate = exchangeRates.rates[code];
      return {
        currency,
        code,
        rate: rate || null,
        info: CURRENCY_INFO[currency],
      };
    })
    .filter((item) => item.rate !== null);

  const formatRate = (rate: number): string => {
    // For rates less than 1, show more decimal places
    if (rate < 1) {
      return rate.toFixed(4);
    }
    // For rates between 1 and 100, show 2 decimal places
    if (rate < 100) {
      return rate.toFixed(2);
    }
    // For rates >= 100, show 1 decimal place
    return rate.toFixed(1);
  };

  return (
    <Card>
      <CardHeader className="p-3 sm:p-4 md:p-5 lg:p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base md:text-lg">
            Currency Exchange Rates
          </CardTitle>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-[0.95]"
              aria-label="Refresh rates"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Rates relative to {baseInfo.code} ({baseInfo.name})
        </p>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-5 lg:p-6">
        {isLoading && !exchangeRates ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : ratesToShow.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No exchange rates available</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {ratesToShow.map(({ currency, code, rate, info }) => (
              <div
                key={currency}
                className="p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center mb-2">
                  <span className="text-lg sm:text-xl font-medium mr-2">
                    {info.symbol}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                    {code}
                  </span>
                </div>
                <p className="text-sm sm:text-base font-semibold text-gray-900">
                  {rate ? formatRate(rate) : 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {info.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

