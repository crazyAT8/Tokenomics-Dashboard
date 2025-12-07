'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { CoinData } from '@/lib/types';
import { Currency } from '@/lib/store';
import { formatCurrency } from '@/lib/utils/currency';
import { sanitizeUrl, escapeHtml } from '@/lib/utils/sanitize';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Coins,
  Award,
  AlertCircle,
} from 'lucide-react';

interface PortfolioOverviewProps {
  coins: CoinData[];
  currency: Currency;
}

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({
  coins,
  currency,
}) => {
  if (coins.length === 0) {
    return null;
  }

  // Calculate aggregated statistics
  const totalMarketCap = coins.reduce((sum, coin) => sum + (coin.market_cap || 0), 0);
  const totalVolume = coins.reduce((sum, coin) => sum + (coin.total_volume || 0), 0);
  
  // Calculate average 24h price change (weighted by market cap)
  const validChanges = coins
    .filter(coin => coin.price_change_percentage_24h !== null && coin.market_cap > 0)
    .map(coin => ({
      change: coin.price_change_percentage_24h!,
      weight: coin.market_cap,
    }));
  
  const weightedAverageChange = validChanges.length > 0
    ? validChanges.reduce((sum, item) => sum + (item.change * item.weight), 0) /
      validChanges.reduce((sum, item) => sum + item.weight, 0)
    : 0;

  // Find best and worst performers
  const coinsWithChanges = coins.filter(
    coin => coin.price_change_percentage_24h !== null
  );
  
  const bestPerformer = coinsWithChanges.length > 0
    ? coinsWithChanges.reduce((best, coin) => {
        if (coin.price_change_percentage_24h! > (best.price_change_percentage_24h ?? -Infinity)) {
          return coin;
        }
        return best;
      })
    : null;

  const worstPerformer = coinsWithChanges.length > 0
    ? coinsWithChanges.reduce((worst, coin) => {
        if (coin.price_change_percentage_24h! < (worst.price_change_percentage_24h ?? Infinity)) {
          return coin;
        }
        return worst;
      })
    : null;

  // Count coins with positive/negative changes
  const positiveCount = coins.filter(
    coin => coin.price_change_percentage_24h !== null && coin.price_change_percentage_24h > 0
  ).length;
  const negativeCount = coins.filter(
    coin => coin.price_change_percentage_24h !== null && coin.price_change_percentage_24h < 0
  ).length;

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="p-3 sm:p-4 md:p-5 lg:p-6 pb-2 sm:pb-3">
          <CardTitle className="text-sm sm:text-base md:text-lg flex items-center">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary-600" />
            Portfolio Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-5 lg:p-6 pt-2 sm:pt-3">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <MetricCard
              title="Total Market Cap"
              value={totalMarketCap}
              icon={<BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />}
              currency={currency}
            />
            
            <MetricCard
              title="Average 24h Change"
              value={weightedAverageChange}
              change={weightedAverageChange}
              changeType={
                weightedAverageChange > 0
                  ? 'positive'
                  : weightedAverageChange < 0
                  ? 'negative'
                  : 'neutral'
              }
              icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />}
              subtitle={`${positiveCount} up, ${negativeCount} down`}
            />
            
            <MetricCard
              title="Total 24h Volume"
              value={totalVolume}
              icon={<Activity className="h-4 w-4 sm:h-5 sm:w-5" />}
              currency={currency}
            />
            
            <MetricCard
              title="Total Coins"
              value={coins.length}
              icon={<Coins className="h-4 w-4 sm:h-5 sm:w-5" />}
              subtitle={`${positiveCount} positive, ${negativeCount} negative`}
            />
            
            {bestPerformer && bestPerformer.price_change_percentage_24h !== null && (
              <MetricCard
                title="Best Performer"
                value={`${bestPerformer.symbol.toUpperCase()}`}
                change={bestPerformer.price_change_percentage_24h}
                changeType="positive"
                icon={<Award className="h-4 w-4 sm:h-5 sm:w-5" />}
                subtitle={escapeHtml(bestPerformer.name)}
              />
            )}
            
            {worstPerformer && worstPerformer.price_change_percentage_24h !== null && (
              <MetricCard
                title="Worst Performer"
                value={`${worstPerformer.symbol.toUpperCase()}`}
                change={worstPerformer.price_change_percentage_24h}
                changeType="negative"
                icon={<AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />}
                subtitle={escapeHtml(worstPerformer.name)}
              />
            )}
          </div>

          {/* Detailed Coin List */}
          <div className="mt-4 sm:mt-6">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
              Watchlist Details
            </h3>
            <div className="overflow-x-auto -mx-1 px-1">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Coin
                        </th>
                        <th className="px-3 py-2 sm:px-4 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-3 py-2 sm:px-4 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          24h Change
                        </th>
                        <th className="px-3 py-2 sm:px-4 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Market Cap
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {coins.map((coin) => {
                        const priceChange = coin.price_change_percentage_24h ?? 0;
                        const isPositive = priceChange >= 0;
                        
                        return (
                          <tr
                            key={coin.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <img
                                  src={sanitizeUrl(coin.image)}
                                  alt={escapeHtml(coin.name)}
                                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full mr-2 flex-shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                    {escapeHtml(coin.name)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {escapeHtml(coin.symbol.toUpperCase())}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-right text-xs sm:text-sm font-medium text-gray-900">
                              {formatCurrency(coin.current_price, currency)}
                            </td>
                            <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-right">
                              <div className={`flex items-center justify-end text-xs sm:text-sm font-medium ${
                                isPositive ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {isPositive ? (
                                  <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                                )}
                                <span>{Math.abs(priceChange).toFixed(2)}%</span>
                              </div>
                            </td>
                            <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-right text-xs sm:text-sm text-gray-500">
                              {formatCurrency(coin.market_cap, currency)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

