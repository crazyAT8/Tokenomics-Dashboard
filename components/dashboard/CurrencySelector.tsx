'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Currency } from '@/lib/store';
import { CURRENCY_INFO } from '@/lib/utils/currency';

interface CurrencySelectorProps {
  selectedCurrency: Currency;
  onCurrencySelect: (currency: Currency) => void;
}

const CURRENCIES: Currency[] = ['usd', 'eur', 'gbp', 'jpy', 'cad', 'aud', 'chf', 'cny', 'inr', 'krw'];

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selectedCurrency,
  onCurrencySelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleCurrencySelect = (currency: Currency) => {
    onCurrencySelect(currency);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('touchstart', handleClickOutside, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
    };
  }, [isOpen]);

  const selectedCurrencyInfo = CURRENCY_INFO[selectedCurrency];

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between min-h-[44px] touch-manipulation active:scale-[0.97] transition-transform"
      >
        <div className="flex items-center min-w-0 flex-1">
          <span className="text-sm sm:text-base font-medium">
            {selectedCurrencyInfo.code}
          </span>
          <span className="ml-2 text-xs sm:text-sm text-gray-500 hidden sm:inline">
            {selectedCurrencyInfo.name}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 ml-2 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 bg-black/20 z-40 sm:hidden touch-none"
            onClick={() => setIsOpen(false)}
            onTouchStart={(e) => {
              e.preventDefault();
              setIsOpen(false);
            }}
          />
          <Card 
            className="absolute top-full left-0 right-0 mt-2 z-50 max-h-[calc(100vh-180px)] sm:max-h-96 overflow-hidden shadow-xl"
          >
            <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-100">Select Currency</h3>
            </div>
            <div 
              className="max-h-[calc(100vh-280px)] sm:max-h-64 overflow-y-auto overscroll-contain scroll-smooth-touch"
            >
              {CURRENCIES.map((currency) => {
                const info = CURRENCY_INFO[currency];
                return (
                  <button
                    key={currency}
                    onClick={() => handleCurrencySelect(currency)}
                    className={`w-full flex items-center justify-between p-3 sm:p-3 hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-gray-800 dark:active:bg-gray-700 transition-colors min-h-[56px] touch-manipulation active:scale-[0.98] select-none ${
                      selectedCurrency === currency ? 'bg-primary-50 dark:bg-primary-900/30' : 'bg-white dark:bg-gray-900'
                    }`}
                  >
                    <div className="flex items-center min-w-0 flex-1">
                      <span className="text-lg sm:text-xl font-medium mr-3">
                        {info.symbol}
                      </span>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                          {info.code}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          {info.name}
                        </p>
                      </div>
                    </div>
                    {selectedCurrency === currency && (
                      <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

