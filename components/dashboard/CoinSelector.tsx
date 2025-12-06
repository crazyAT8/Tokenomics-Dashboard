'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CoinData } from '@/lib/types';
import { sanitizeSearchQuery, sanitizeUrl, escapeHtml } from '@/lib/utils/sanitize';

interface CoinSelectorProps {
  selectedCoin: string;
  onCoinSelect: (coinId: string) => void;
}

export const CoinSelector: React.FC<CoinSelectorProps> = ({
  selectedCoin,
  onCoinSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);

  const fetchCoins = async (query: string = '') => {
    setIsLoading(true);
    try {
      // Sanitize query before sending
      const sanitizedQuery = sanitizeSearchQuery(query);
      console.log('CoinSelector - fetching coins with query:', sanitizedQuery);
      const response = await fetch(`/api/coins/search?q=${encodeURIComponent(sanitizedQuery)}&limit=20`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch coins: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('CoinSelector - received data:', Array.isArray(data) ? data.length : 'not an array', data);
      setCoins(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching coins:', error);
      setCoins([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCoins(searchQuery);
    }
  }, [isOpen, searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sanitize search input
    const sanitized = sanitizeSearchQuery(e.target.value);
    setSearchQuery(sanitized);
  };

  const handleCoinSelect = (coinId: string) => {
    onCoinSelect(coinId);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Handle swipe to close on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isOpen) return;
    
    const touchY = e.touches[0].clientY;
    const touchX = e.touches[0].clientX;
    const deltaY = touchY - touchStartY.current;
    const deltaX = Math.abs(touchX - touchStartX.current);
    
    // Only close if swiping down (not sideways) and more than 50px
    if (deltaY > 50 && deltaX < 30 && dropdownRef.current) {
      const scrollTop = dropdownRef.current.scrollTop;
      // Only close if at the top of the scroll area
      if (scrollTop === 0) {
        setIsOpen(false);
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Use capture phase for better touch handling
      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('touchstart', handleClickOutside, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
    };
  }, [isOpen]);

  const selectedCoinData = coins.find(coin => coin.id === selectedCoin);

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between min-h-[44px] touch-manipulation active:scale-[0.97] transition-transform"
      >
        <div className="flex items-center min-w-0 flex-1">
          {selectedCoinData && (
            <img
              src={sanitizeUrl(selectedCoinData.image)}
              alt={escapeHtml(selectedCoinData.name)}
              className="w-5 h-5 sm:w-6 sm:h-6 mr-2 rounded-full flex-shrink-0"
            />
          )}
          <span className="truncate text-sm sm:text-base">
            {selectedCoinData ? escapeHtml(selectedCoinData.name) : 'Select a coin'}
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
            className="absolute top-full left-0 right-0 mt-2 z-50 max-h-[calc(100vh-180px)] sm:max-h-[calc(100vh-220px)] md:max-h-96 overflow-hidden shadow-xl"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          >
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <Input
                variant="search"
                placeholder="Search coins..."
                value={searchQuery}
                onChange={handleSearchChange}
                icon={<Search className="h-4 w-4" />}
                className="min-h-[44px] text-base sm:text-sm"
                autoFocus
              />
            </div>
            <div 
              ref={dropdownRef}
              className="max-h-[calc(100vh-280px)] sm:max-h-[calc(100vh-300px)] md:max-h-64 overflow-y-auto overscroll-contain scroll-smooth-touch"
            >
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">
                  Loading coins...
                </div>
              ) : coins.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No coins found
                </div>
              ) : (
                coins.map((coin) => (
                  <button
                    key={coin.id}
                    onClick={() => handleCoinSelect(coin.id)}
                    className="w-full flex items-center p-3 sm:p-3 hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[56px] touch-manipulation active:scale-[0.98] select-none"
                  >
                    <img
                      src={sanitizeUrl(coin.image)}
                      alt={escapeHtml(coin.name)}
                      className="w-8 h-8 sm:w-8 sm:h-8 mr-3 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{escapeHtml(coin.name)}</p>
                      <p className="text-xs sm:text-sm text-gray-500 uppercase">{escapeHtml(coin.symbol)}</p>
                    </div>
                    {coin.market_cap_rank && (
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        #{coin.market_cap_rank}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
