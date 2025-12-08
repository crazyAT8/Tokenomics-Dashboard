'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePortfolio } from '@/hooks/usePortfolio';
import { CoinData } from '@/lib/types';
import { Currency } from '@/lib/store';
import { formatCurrency } from '@/lib/utils/currency';
import { sanitizeUrl, escapeHtml, sanitizeSearchQuery } from '@/lib/utils/sanitize';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Wallet,
  Plus,
  Trash2,
  Search,
  X,
  Edit2,
  Check,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { PortfolioPerformanceMetrics } from '@/components/dashboard/PortfolioPerformanceMetrics';

interface PortfolioManagerProps {
  currency: Currency;
  onCoinSelect?: (coinId: string) => void;
}

export const PortfolioManager: React.FC<PortfolioManagerProps> = ({
  currency,
  onCoinSelect,
}) => {
  const {
    portfolio,
    addCoin,
    removeCoin,
    updateQuantity,
    updatePurchasePrice,
    isInPortfolio,
  } = usePortfolio();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CoinData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editingCoinId, setEditingCoinId] = useState<string | null>(null);
  const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>({});
  const [purchasePriceInputs, setPurchasePriceInputs] = useState<Record<string, string>>({});
  const [addQuantityInputs, setAddQuantityInputs] = useState<Record<string, string>>({});
  const [addPurchasePriceInputs, setAddPurchasePriceInputs] = useState<Record<string, string>>({});
  const [portfolioCoinsData, setPortfolioCoinsData] = useState<CoinData[]>([]);
  const [isLoadingPortfolioData, setIsLoadingPortfolioData] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch current coin data for portfolio entries
  useEffect(() => {
    if (portfolio.length === 0) {
      setPortfolioCoinsData([]);
      return;
    }

    const fetchPortfolioData = async () => {
      setIsLoadingPortfolioData(true);
      try {
        const coinIds = portfolio.map((entry) => entry.coinId).join(',');
        const response = await fetch(`/api/coins/search?ids=${encodeURIComponent(coinIds)}&limit=${portfolio.length}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch portfolio coins: ${response.statusText}`);
        }
        
        const data = await response.json();
        // Sort to maintain portfolio order
        const sorted = portfolio
          .map((entry) => data.find((coin: CoinData) => coin.id === entry.coinId))
          .filter((coin): coin is CoinData => coin !== undefined);
        
        setPortfolioCoinsData(sorted);
      } catch (error) {
        console.error('Error fetching portfolio coin data:', error);
        setPortfolioCoinsData([]);
      } finally {
        setIsLoadingPortfolioData(false);
      }
    };

    fetchPortfolioData();
  }, [portfolio]);

  // Search for coins
  const handleSearch = async (query: string) => {
    const sanitized = sanitizeSearchQuery(query);
    setSearchQuery(sanitized);
    
    if (!sanitized.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/coins/search?q=${encodeURIComponent(sanitized)}&limit=10`);
      
      if (!response.ok) {
        throw new Error(`Failed to search coins: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error searching coins:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddCoin = (coin: CoinData, quantity: number, purchasePrice?: number) => {
    if (quantity > 0) {
      addCoin(coin, quantity, purchasePrice);
      setShowAddForm(false);
      setSearchQuery('');
      setSearchResults([]);
      setAddQuantityInputs({});
      setAddPurchasePriceInputs({});
    }
  };

  const handleRemoveCoin = (coinId: string) => {
    removeCoin(coinId);
  };

  const handleStartEdit = (coinId: string, currentQuantity: number, currentPurchasePrice?: number) => {
    setEditingCoinId(coinId);
    setQuantityInputs({ ...quantityInputs, [coinId]: currentQuantity.toString() });
    setPurchasePriceInputs({ ...purchasePriceInputs, [coinId]: currentPurchasePrice?.toString() || '' });
  };

  const handleSaveEdit = (coinId: string) => {
    const quantityStr = quantityInputs[coinId];
    const purchasePriceStr = purchasePriceInputs[coinId];
    const quantity = parseFloat(quantityStr || '0');
    const purchasePrice = purchasePriceStr ? parseFloat(purchasePriceStr) : undefined;
    
    if (quantity > 0) {
      updateQuantity(coinId, quantity);
      updatePurchasePrice(coinId, purchasePrice);
    } else {
      removeCoin(coinId);
    }
    
    setEditingCoinId(null);
    setQuantityInputs({});
    setPurchasePriceInputs({});
  };

  const handleCancelEdit = () => {
    setEditingCoinId(null);
    setQuantityInputs({});
    setPurchasePriceInputs({});
  };

  // Calculate total portfolio value and P&L
  const portfolioCalculations = portfolio.reduce((acc, entry) => {
    const coinData = portfolioCoinsData.find((coin) => coin.id === entry.coinId);
    if (coinData) {
      const currentValue = coinData.current_price * entry.quantity;
      const costBasis = entry.purchasePrice ? entry.purchasePrice * entry.quantity : 0;
      const profitLoss = entry.purchasePrice ? currentValue - costBasis : null;
      const profitLossPercent = entry.purchasePrice && costBasis > 0 
        ? ((currentValue - costBasis) / costBasis) * 100 
        : null;
      
      acc.totalValue += currentValue;
      acc.totalCostBasis += costBasis;
      if (profitLoss !== null) {
        acc.totalProfitLoss += profitLoss;
      }
    }
    return acc;
  }, {
    totalValue: 0,
    totalCostBasis: 0,
    totalProfitLoss: 0,
  });

  const totalValue = portfolioCalculations.totalValue;
  const totalProfitLoss = portfolioCalculations.totalProfitLoss;
  const totalProfitLossPercent = portfolioCalculations.totalCostBasis > 0
    ? (totalProfitLoss / portfolioCalculations.totalCostBasis) * 100
    : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAddForm(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    };

    if (showAddForm) {
      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('touchstart', handleClickOutside, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
    };
  }, [showAddForm]);

  return (
    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between hover:bg-gray-50 transition-colors min-h-[44px] sm:min-h-[40px] touch-manipulation"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
          <span className="text-sm sm:text-base font-medium text-gray-700">
            Portfolio Tracking
          </span>
          {portfolio.length > 0 && (
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
              {portfolio.length}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 p-3 sm:p-4 space-y-4">
          {/* Portfolio Performance Metrics */}
          {portfolio.length > 0 && portfolioCoinsData.length > 0 && (
            <PortfolioPerformanceMetrics
              portfolio={portfolio}
              portfolioCoinsData={portfolioCoinsData}
              currency={currency}
            />
          )}

          {/* Portfolio Summary */}
          {portfolio.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-gray-600">
                  Total Portfolio Value
                </span>
                <span className="text-base sm:text-lg font-bold text-gray-900">
                  {formatCurrency(totalValue, currency)}
                </span>
              </div>
              {portfolioCalculations.totalCostBasis > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium text-gray-600">
                      Total Cost Basis
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {formatCurrency(portfolioCalculations.totalCostBasis, currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="text-xs sm:text-sm font-medium text-gray-600">
                      Total P&L
                    </span>
                    <div className="flex items-center gap-2">
                      {totalProfitLoss >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`text-sm sm:text-base font-bold ${
                        totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(Math.abs(totalProfitLoss), currency)}
                        {totalProfitLossPercent !== null && (
                          <span className="ml-1 text-xs">
                            ({totalProfitLossPercent >= 0 ? '+' : ''}{totalProfitLossPercent.toFixed(2)}%)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </>
              )}
              <div className="text-xs text-gray-500 pt-1">
                {portfolio.length} {portfolio.length === 1 ? 'coin' : 'coins'} in portfolio
              </div>
            </div>
          )}

          {/* Add Coin Form */}
          <div className="relative">
            {!showAddForm ? (
              <Button
                variant="outline"
                onClick={() => setShowAddForm(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Coin to Portfolio
              </Button>
            ) : (
              <div ref={dropdownRef} className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      variant="search"
                      placeholder="Search coins..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      icon={<Search className="h-4 w-4" />}
                      className="min-h-[44px] text-base sm:text-sm"
                      autoFocus
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSearchResults([]);
                          setAddQuantityInputs({});
                          setAddPurchasePriceInputs({});
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowAddForm(false);
                      setSearchQuery('');
                      setSearchResults([]);
                      setAddQuantityInputs({});
                      setAddPurchasePriceInputs({});
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Search Results */}
                {searchQuery && (
                  <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        Searching...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No coins found
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {searchResults.map((coin) => {
                          const inPortfolio = isInPortfolio(coin.id);
                          const quantity = addQuantityInputs[coin.id] || '1';

                          return (
                            <div
                              key={coin.id}
                              className="p-3 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <img
                                    src={sanitizeUrl(coin.image)}
                                    alt={escapeHtml(coin.name)}
                                    className="w-6 h-6 rounded-full flex-shrink-0"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium text-gray-900 truncate">
                                      {escapeHtml(coin.name)}
                                    </div>
                                    <div className="text-xs text-gray-500 uppercase">
                                      {escapeHtml(coin.symbol)}
                                    </div>
                                  </div>
                                </div>
                                {inPortfolio && (
                                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                                    In Portfolio
                                  </span>
                                )}
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    placeholder="Quantity"
                                    value={quantity}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === '' || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0)) {
                                        setAddQuantityInputs({ ...addQuantityInputs, [coin.id]: val });
                                      }
                                    }}
                                    min="0"
                                    step="0.00000001"
                                    className="flex-1 min-h-[36px] text-sm"
                                  />
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => {
                                      const purchasePrice = addPurchasePriceInputs[coin.id] 
                                        ? parseFloat(addPurchasePriceInputs[coin.id]) 
                                        : undefined;
                                      handleAddCoin(coin, parseFloat(quantity) || 0, purchasePrice);
                                      setAddQuantityInputs({ ...addQuantityInputs, [coin.id]: '1' });
                                      setAddPurchasePriceInputs({ ...addPurchasePriceInputs, [coin.id]: '' });
                                    }}
                                    disabled={!quantity || parseFloat(quantity) <= 0}
                                    className="min-h-[36px]"
                                  >
                                    {inPortfolio ? 'Add More' : 'Add'}
                                  </Button>
                                </div>
                                <Input
                                  type="number"
                                  placeholder={`Purchase Price (${currency.toUpperCase()}) - Optional`}
                                  value={addPurchasePriceInputs[coin.id] || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '' || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0)) {
                                      setAddPurchasePriceInputs({ ...addPurchasePriceInputs, [coin.id]: val });
                                    }
                                  }}
                                  min="0"
                                  step="0.01"
                                  className="w-full min-h-[36px] text-sm"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Portfolio List */}
          {portfolio.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wallet className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No coins in your portfolio yet.</p>
              <p className="text-xs mt-1">Add coins to start tracking your holdings.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                Your Portfolio
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {portfolio.map((entry) => {
                  const coinData = portfolioCoinsData.find((coin) => coin.id === entry.coinId);
                  const currentValue = coinData ? coinData.current_price * entry.quantity : 0;
                  const costBasis = entry.purchasePrice ? entry.purchasePrice * entry.quantity : 0;
                  const profitLoss = entry.purchasePrice && coinData ? currentValue - costBasis : null;
                  const profitLossPercent = entry.purchasePrice && costBasis > 0 && coinData
                    ? ((currentValue - costBasis) / costBasis) * 100
                    : null;
                  const isEditing = editingCoinId === entry.coinId;
                  const quantityValue = quantityInputs[entry.coinId] ?? entry.quantity.toString();
                  const purchasePriceValue = purchasePriceInputs[entry.coinId] ?? (entry.purchasePrice?.toString() || '');

                  return (
                    <div
                      key={entry.id}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <img
                            src={sanitizeUrl(entry.image)}
                            alt={escapeHtml(entry.name)}
                            className="w-8 h-8 rounded-full flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {escapeHtml(entry.name)}
                            </div>
                            <div className="text-xs text-gray-500 uppercase">
                              {escapeHtml(entry.symbol)}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveCoin(entry.coinId)}
                          className="p-1.5 hover:bg-red-50 text-red-600 rounded transition-colors touch-manipulation"
                          aria-label="Remove from portfolio"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Quantity:</span>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={quantityValue}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '' || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0)) {
                                    setQuantityInputs({ ...quantityInputs, [entry.coinId]: val });
                                  }
                                }}
                                min="0"
                                step="0.00000001"
                                className="w-24 min-h-[32px] text-xs"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveEdit(entry.coinId)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                aria-label="Save"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                aria-label="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {entry.quantity.toLocaleString(undefined, {
                                  maximumFractionDigits: 8,
                                })}
                              </span>
                              <button
                                onClick={() => handleStartEdit(entry.coinId, entry.quantity, entry.purchasePrice)}
                                className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                aria-label="Edit quantity"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {isEditing && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Purchase Price:</span>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                placeholder="Optional"
                                value={purchasePriceValue}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '' || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0)) {
                                    setPurchasePriceInputs({ ...purchasePriceInputs, [entry.coinId]: val });
                                  }
                                }}
                                min="0"
                                step="0.01"
                                className="w-24 min-h-[32px] text-xs"
                              />
                            </div>
                          </div>
                        )}

                        {!isEditing && entry.purchasePrice && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Purchase Price:</span>
                            <span className="font-medium text-gray-900">
                              {formatCurrency(entry.purchasePrice, currency)}
                            </span>
                          </div>
                        )}

                        {coinData && (
                          <>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">Current Price:</span>
                              <span className="font-medium text-gray-900">
                                {formatCurrency(coinData.current_price, currency)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">Total Value:</span>
                              <span className="font-semibold text-gray-900">
                                {formatCurrency(currentValue, currency)}
                              </span>
                            </div>
                            {profitLoss !== null && (
                              <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200">
                                <span className="text-gray-600">P&L:</span>
                                <div className="flex items-center gap-1">
                                  {profitLoss >= 0 ? (
                                    <TrendingUp className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3 text-red-600" />
                                  )}
                                  <span className={`font-semibold ${
                                    profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {formatCurrency(Math.abs(profitLoss), currency)}
                                    {profitLossPercent !== null && (
                                      <span className="ml-1">
                                        ({profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%)
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            )}
                            {onCoinSelect && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onCoinSelect(entry.coinId)}
                                className="w-full mt-2 text-xs"
                              >
                                View Details
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

