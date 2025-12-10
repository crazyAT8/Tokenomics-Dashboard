'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { usePortfolio } from '@/hooks/usePortfolio';
import { CoinData, PortfolioEntry } from '@/lib/types';
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
  Download,
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
    transactions,
    contributions,
    addTransaction,
    addContribution,
    removeCoin,
    updateQuantity,
    updatePurchasePrice,
    isInPortfolio,
    calculatePositionFromTransactions,
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
  const [transactionTypeInputs, setTransactionTypeInputs] = useState<Record<string, 'buy' | 'sell'>>({});
  const [transactionFeeInputs, setTransactionFeeInputs] = useState<Record<string, string>>({});
  const [transactionDateInputs, setTransactionDateInputs] = useState<Record<string, string>>({});
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionType, setContributionType] = useState<'contribution' | 'withdrawal'>('contribution');
  const [contributionNote, setContributionNote] = useState('');
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

  const handleAddTransaction = (
    coin: CoinData,
    quantity: number,
    price: number,
    type: 'buy' | 'sell',
    fee?: number,
    date?: string
  ) => {
    if (quantity > 0) {
      const timestamp = date ? new Date(date).getTime() : Date.now();
      const safeTimestamp = isNaN(timestamp) ? Date.now() : timestamp;
      addTransaction(coin, type, quantity, price, fee, safeTimestamp);
      setShowAddForm(false);
      setSearchQuery('');
      setSearchResults([]);
      setAddQuantityInputs({});
      setAddPurchasePriceInputs({});
      setTransactionTypeInputs({});
      setTransactionFeeInputs({});
      setTransactionDateInputs({});
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

  const handleAddContributionClick = () => {
    const amount = parseFloat(contributionAmount || '0');
    if (amount > 0) {
      addContribution(contributionType, amount, Date.now(), contributionNote || undefined);
      setContributionAmount('');
      setContributionNote('');
    }
  };

  const handleExportCsv = () => {
    if (positionPerformances.length === 0) return;
    const headers = [
      'Asset',
      'Quantity',
      'Cost Basis',
      'Current Value',
      'Unrealized P&L',
      'Realized P&L',
      'Total P&L',
      'ROI %',
    ];

    const rows = positionPerformances.map((p) => [
      p.entry.symbol.toUpperCase(),
      p.quantity.toFixed(8),
      p.costBasis.toFixed(2),
      p.currentValue.toFixed(2),
      p.unrealizedPnl.toFixed(2),
      p.realizedPnl.toFixed(2),
      p.totalPnl.toFixed(2),
      p.totalRoi !== null ? p.totalRoi.toFixed(2) : 'N/A',
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'investment-log.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const positionPerformances = useMemo(() => {
    return portfolio.map((entry) => {
      const coinTransactions = transactions.filter((tx) => tx.coinId === entry.coinId);
      const stats = calculatePositionFromTransactions(coinTransactions);
      const coinData = portfolioCoinsData.find((coin) => coin.id === entry.coinId);
      const currentValue = coinData ? coinData.current_price * stats.quantity : 0;
      const unrealizedPnl = currentValue - stats.costBasis;
      const totalPnl = stats.realizedPnl + unrealizedPnl;
      const roi = stats.costBasis > 0 ? (unrealizedPnl / stats.costBasis) * 100 : null;
      const totalRoi = stats.costBasis > 0 ? (totalPnl / stats.costBasis) * 100 : null;

      return {
        entry,
        coinData,
        ...stats,
        currentValue,
        unrealizedPnl,
        totalPnl,
        roi,
        totalRoi,
      };
    });
  }, [portfolio, transactions, portfolioCoinsData, calculatePositionFromTransactions]);

  const performanceByCoin = useMemo(() => {
    const map: Record<string, (typeof positionPerformances)[number]> = {};
    positionPerformances.forEach((p) => {
      map[p.entry.coinId] = p;
    });
    return map;
  }, [positionPerformances]);

  const totals = useMemo(() => {
    const aggregated = positionPerformances.reduce(
      (acc, p) => {
        acc.totalValue += p.currentValue;
        acc.totalCostBasis += p.costBasis;
        acc.totalRealized += p.realizedPnl;
        acc.totalUnrealized += p.unrealizedPnl;
        return acc;
      },
      { totalValue: 0, totalCostBasis: 0, totalRealized: 0, totalUnrealized: 0 }
    );

    const netContributions = contributions.reduce(
      (acc, c) => acc + (c.type === 'contribution' ? c.amount : -c.amount),
      0
    );

    return {
      totalValue: aggregated.totalValue,
      totalCostBasis: aggregated.totalCostBasis,
      totalRealized: aggregated.totalRealized,
      totalUnrealized: aggregated.totalUnrealized,
      totalPnl: aggregated.totalRealized + aggregated.totalUnrealized,
      totalPnlPercent:
        aggregated.totalCostBasis > 0
          ? ((aggregated.totalRealized + aggregated.totalUnrealized) / aggregated.totalCostBasis) * 100
          : null,
      netContributions,
      netInvested: netContributions,
    };
  }, [positionPerformances, contributions]);

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
    <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[44px] sm:min-h-[40px] touch-manipulation"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
          <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-100">
            Portfolio Tracking
          </span>
          {portfolio.length > 0 && (
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
              {portfolio.length}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-800 p-3 sm:p-4 space-y-4 bg-white dark:bg-gray-900">
          {/* Portfolio Performance Metrics */}
          {portfolio.length > 0 && portfolioCoinsData.length > 0 && (
            <PortfolioPerformanceMetrics
              portfolio={portfolio}
              portfolioCoinsData={portfolioCoinsData}
              transactions={transactions}
              contributions={contributions}
              currency={currency}
            />
          )}

          {/* Portfolio Summary */}
          {portfolio.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
                  Total Portfolio Value
                </span>
                <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(totals.totalValue, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
                  Net Invested (contrib - withdrawals)
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {formatCurrency(totals.netInvested, currency)}
                </span>
              </div>
              {totals.totalCostBasis > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
                    Total Cost Basis (open)
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {formatCurrency(totals.totalCostBasis, currency)}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Realized P&L</span>
                  <div className="flex items-center gap-2">
                    {totals.totalRealized >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span
                      className={`text-sm sm:text-base font-bold ${
                        totals.totalRealized >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(Math.abs(totals.totalRealized), currency)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Unrealized P&L</span>
                  <div className="flex items-center gap-2">
                    {totals.totalUnrealized >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span
                      className={`text-sm sm:text-base font-bold ${
                        totals.totalUnrealized >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(Math.abs(totals.totalUnrealized), currency)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
                  Total P&L
                </span>
                <div className="flex items-center gap-2">
                  {totals.totalPnl >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm sm:text-base font-bold ${
                    totals.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(Math.abs(totals.totalPnl), currency)}
                    {totals.totalPnlPercent !== null && (
                      <span className="ml-1 text-xs">
                        ({totals.totalPnlPercent >= 0 ? '+' : ''}{totals.totalPnlPercent.toFixed(2)}%)
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 pt-1">
                {portfolio.length} {portfolio.length === 1 ? 'coin' : 'coins'} in portfolio
              </div>
            </div>
          )}

          {/* Contributions / Withdrawals */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 sm:p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-100">Cash Flow</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Net: {formatCurrency(totals.netInvested, currency)}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder={`Amount (${currency.toUpperCase()})`}
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                min="0"
                step="0.01"
                className="min-h-[36px] text-sm"
              />
              <input
                type="text"
                placeholder="Note (optional)"
                value={contributionNote}
                onChange={(e) => setContributionNote(e.target.value)}
                className="border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-md px-3 py-2 min-h-[36px] text-sm"
              />
              <select
                className="border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-md px-3 py-2 min-h-[36px] text-sm"
                value={contributionType}
                onChange={(e) => setContributionType(e.target.value as 'contribution' | 'withdrawal')}
              >
                <option value="contribution">Contribution</option>
                <option value="withdrawal">Withdrawal</option>
              </select>
              <Button variant="primary" onClick={handleAddContributionClick} className="min-h-[36px]">
                Add Cash Flow
              </Button>
            </div>
            {contributions.length > 0 && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {contributions.length} {contributions.length === 1 ? 'entry' : 'entries'} logged
              </div>
            )}
          </div>

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
                          const typeValue = transactionTypeInputs[coin.id] || 'buy';
                          const priceValue = addPurchasePriceInputs[coin.id] || '';
                          const feeValue = transactionFeeInputs[coin.id] || '';
                          const dateValue = transactionDateInputs[coin.id] || '';

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
                                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                  <label className="text-xs text-gray-600">Type</label>
                                  <select
                                    className="border border-gray-300 rounded-md px-2 py-1 text-sm min-h-[36px]"
                                    value={typeValue}
                                    onChange={(e) =>
                                      setTransactionTypeInputs({ ...transactionTypeInputs, [coin.id]: e.target.value as 'buy' | 'sell' })
                                    }
                                  >
                                    <option value="buy">Buy</option>
                                    <option value="sell">Sell</option>
                                  </select>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2">
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
                                  <Input
                                    type="number"
                                    placeholder={`Price (${currency.toUpperCase()})`}
                                    value={priceValue}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === '' || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0)) {
                                        setAddPurchasePriceInputs({ ...addPurchasePriceInputs, [coin.id]: val });
                                      }
                                    }}
                                    min="0"
                                    step="0.01"
                                    className="flex-1 min-h-[36px] text-sm"
                                  />
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => {
                                      const price = parseFloat(priceValue) || 0;
                                      const fee = feeValue ? parseFloat(feeValue) : undefined;
                                      handleAddTransaction(coin, parseFloat(quantity) || 0, price, typeValue, fee, dateValue);
                                      setAddQuantityInputs({ ...addQuantityInputs, [coin.id]: '1' });
                                      setAddPurchasePriceInputs({ ...addPurchasePriceInputs, [coin.id]: '' });
                                      setTransactionFeeInputs({ ...transactionFeeInputs, [coin.id]: '' });
                                      setTransactionDateInputs({ ...transactionDateInputs, [coin.id]: '' });
                                    }}
                                    disabled={!quantity || parseFloat(quantity) <= 0 || !priceValue}
                                    className="min-h-[36px]"
                                  >
                                    {inPortfolio ? 'Add Tx' : 'Add'}
                                  </Button>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <Input
                                    type="number"
                                    placeholder="Fee (optional)"
                                    value={feeValue}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === '' || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0)) {
                                        setTransactionFeeInputs({ ...transactionFeeInputs, [coin.id]: val });
                                      }
                                    }}
                                    min="0"
                                    step="0.01"
                                    className="flex-1 min-h-[36px] text-sm"
                                  />
                                  <Input
                                    type="date"
                                    placeholder="Date"
                                    value={dateValue}
                                    onChange={(e) => setTransactionDateInputs({ ...transactionDateInputs, [coin.id]: e.target.value })}
                                    className="flex-1 min-h-[36px] text-sm"
                                  />
                                </div>
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

          {/* Investment Log */}
          {positionPerformances.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Investment Log</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportCsv}
                  className="text-xs flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-2 pr-3">Asset</th>
                      <th className="py-2 pr-3">Qty</th>
                      <th className="py-2 pr-3">Cost Basis</th>
                      <th className="py-2 pr-3">Current Value</th>
                      <th className="py-2 pr-3">Unrealized</th>
                      <th className="py-2 pr-3">Realized</th>
                      <th className="py-2 pr-3">Total P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {positionPerformances.map((p) => (
                      <tr key={p.entry.coinId}>
                        <td className="py-2 pr-3 font-medium text-gray-900">{escapeHtml(p.entry.symbol.toUpperCase())}</td>
                        <td className="py-2 pr-3 text-gray-700">
                          {p.quantity.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                        </td>
                        <td className="py-2 pr-3 text-gray-700">{formatCurrency(p.costBasis, currency)}</td>
                        <td className="py-2 pr-3 text-gray-700">{formatCurrency(p.currentValue, currency)}</td>
                        <td className="py-2 pr-3">
                          <span className={p.unrealizedPnl >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                            {formatCurrency(Math.abs(p.unrealizedPnl), currency)}
                            {p.roi !== null && (
                              <span className="ml-1 text-xs">
                                ({p.roi >= 0 ? '+' : ''}{p.roi.toFixed(2)}%)
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="py-2 pr-3">
                          <span className={p.realizedPnl >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                            {formatCurrency(Math.abs(p.realizedPnl), currency)}
                          </span>
                        </td>
                        <td className="py-2 pr-3">
                          <span className={p.totalPnl >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                            {formatCurrency(Math.abs(p.totalPnl), currency)}
                            {p.totalRoi !== null && (
                              <span className="ml-1 text-xs">
                                ({p.totalRoi >= 0 ? '+' : ''}{p.totalRoi.toFixed(2)}%)
                              </span>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
                  const performance = performanceByCoin[entry.coinId];
                  const coinData = performance?.coinData ?? portfolioCoinsData.find((coin) => coin.id === entry.coinId);
                  const currentValue = performance?.currentValue ?? 0;
                  const costBasis = performance?.costBasis ?? 0;
                  const profitLoss = performance ? performance.unrealizedPnl : null;
                  const profitLossPercent = performance ? performance.roi : null;
                  const quantityDisplay = performance ? performance.quantity : entry.quantity;
                  const avgCost = performance?.averageCost ?? entry.purchasePrice;
                  const isEditing = editingCoinId === entry.coinId;
                  const quantityValue = quantityInputs[entry.coinId] ?? quantityDisplay.toString();
                  const purchasePriceValue = purchasePriceInputs[entry.coinId] ?? (avgCost?.toString() || '');

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
                                {quantityDisplay.toLocaleString(undefined, {
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

                        {!isEditing && avgCost !== undefined && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Avg. Cost:</span>
                            <span className="font-medium text-gray-900">
                              {formatCurrency(avgCost, currency)}
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

