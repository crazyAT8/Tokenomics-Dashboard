'use client';

import React, { useState, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CoinData } from '@/lib/types';

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

  const fetchCoins = async (query: string = '') => {
    setIsLoading(true);
    try {
      console.log('CoinSelector - fetching coins with query:', query);
      const response = await fetch(`/api/coins/search?q=${encodeURIComponent(query)}&limit=20`);
      
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
    setSearchQuery(e.target.value);
  };

  const handleCoinSelect = (coinId: string) => {
    onCoinSelect(coinId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const selectedCoinData = coins.find(coin => coin.id === selectedCoin);

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <div className="flex items-center">
          {selectedCoinData && (
            <img
              src={selectedCoinData.image}
              alt={selectedCoinData.name}
              className="w-6 h-6 mr-2 rounded-full"
            />
          )}
          <span className="truncate">
            {selectedCoinData?.name || 'Select a coin'}
          </span>
        </div>
        <ChevronDown className="h-4 w-4 ml-2" />
      </Button>

      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <Input
              variant="search"
              placeholder="Search coins..."
              value={searchQuery}
              onChange={handleSearchChange}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
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
                  className="w-full flex items-center p-3 hover:bg-gray-50 transition-colors"
                >
                  <img
                    src={coin.image}
                    alt={coin.name}
                    className="w-8 h-8 mr-3 rounded-full"
                  />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">{coin.name}</p>
                    <p className="text-sm text-gray-500 uppercase">{coin.symbol}</p>
                  </div>
                  {coin.market_cap_rank && (
                    <span className="text-xs text-gray-400">
                      #{coin.market_cap_rank}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
