'use client';

import React from 'react';
import { PortfolioEntry } from '@/lib/types';
import { CoinData } from '@/lib/types';
import { Currency } from '@/lib/store';
import { formatCurrency } from '@/lib/utils/currency';
import { sanitizeUrl, escapeHtml } from '@/lib/utils/sanitize';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { MetricCard } from '@/components/dashboard/MetricCard';
import {
  TrendingUp,
  TrendingDown,
  Award,
  AlertCircle,
  PieChart,
  Target,
  BarChart3,
  DollarSign,
  Percent,
} from 'lucide-react';

interface PortfolioPerformanceMetricsProps {
  portfolio: PortfolioEntry[];
  portfolioCoinsData: CoinData[];
  currency: Currency;
}

interface PerformanceMetrics {
  totalValue: number;
  totalCostBasis: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number | null;
  profitablePositions: number;
  unprofitablePositions: number;
  breakEvenPositions: number;
  bestPerformer: {
    entry: PortfolioEntry;
    coinData: CoinData;
    profitLoss: number;
    profitLossPercent: number;
  } | null;
  worstPerformer: {
    entry: PortfolioEntry;
    coinData: CoinData;
    profitLoss: number;
    profitLossPercent: number;
  } | null;
  averageROI: number | null;
  largestPosition: {
    entry: PortfolioEntry;
    coinData: CoinData;
    value: number;
    allocationPercent: number;
  } | null;
  positions: Array<{
    entry: PortfolioEntry;
    coinData: CoinData;
    currentValue: number;
    costBasis: number;
    profitLoss: number;
    profitLossPercent: number | null;
    allocationPercent: number;
  }>;
}

function calculatePerformanceMetrics(
  portfolio: PortfolioEntry[],
  portfolioCoinsData: CoinData[]
): PerformanceMetrics {
  const positions = portfolio
    .map((entry) => {
      const coinData = portfolioCoinsData.find((coin) => coin.id === entry.coinId);
      if (!coinData) return null;

      const currentValue = coinData.current_price * entry.quantity;
      const costBasis = entry.purchasePrice ? entry.purchasePrice * entry.quantity : 0;
      const profitLoss = entry.purchasePrice ? currentValue - costBasis : 0;
      const profitLossPercent =
        entry.purchasePrice && costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : null;

      return {
        entry,
        coinData,
        currentValue,
        costBasis,
        profitLoss,
        profitLossPercent,
        allocationPercent: 0, // Will be calculated after total value is known
      };
    })
    .filter((pos): pos is NonNullable<typeof pos> => pos !== null);

  const totalValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0);
  const totalCostBasis = positions.reduce((sum, pos) => sum + pos.costBasis, 0);
  const totalProfitLoss = positions.reduce((sum, pos) => sum + pos.profitLoss, 0);
  const totalProfitLossPercent =
    totalCostBasis > 0 ? (totalProfitLoss / totalCostBasis) * 100 : null;

  // Calculate allocation percentages
  positions.forEach((pos) => {
    pos.allocationPercent = totalValue > 0 ? (pos.currentValue / totalValue) * 100 : 0;
  });

  // Count profitable/unprofitable positions
  const profitablePositions = positions.filter(
    (pos) => pos.profitLossPercent !== null && pos.profitLossPercent > 0
  ).length;
  const unprofitablePositions = positions.filter(
    (pos) => pos.profitLossPercent !== null && pos.profitLossPercent < 0
  ).length;
  const breakEvenPositions = positions.filter(
    (pos) => pos.profitLossPercent === null || pos.profitLossPercent === 0
  ).length;

  // Find best and worst performers
  const positionsWithPL = positions.filter((pos) => pos.profitLossPercent !== null);
  const bestPerformer =
    positionsWithPL.length > 0
      ? positionsWithPL.reduce((best, pos) => {
          if (pos.profitLossPercent! > best.profitLossPercent!) return pos;
          return best;
        })
      : null;
  const worstPerformer =
    positionsWithPL.length > 0
      ? positionsWithPL.reduce((worst, pos) => {
          if (pos.profitLossPercent! < worst.profitLossPercent!) return pos;
          return worst;
        })
      : null;

  // Calculate average ROI
  const validROIs = positionsWithPL.map((pos) => pos.profitLossPercent!);
  const averageROI = validROIs.length > 0 ? validROIs.reduce((sum, roi) => sum + roi, 0) / validROIs.length : null;

  // Find largest position
  const largestPosition =
    positions.length > 0
      ? (() => {
          const largest = positions.reduce((largest, pos) => {
            if (pos.currentValue > largest.currentValue) {
              return pos;
            }
            return largest;
          });
          return {
            entry: largest.entry,
            coinData: largest.coinData,
            value: largest.currentValue,
            allocationPercent: largest.allocationPercent,
          };
        })()
      : null;

  return {
    totalValue,
    totalCostBasis,
    totalProfitLoss,
    totalProfitLossPercent,
    profitablePositions,
    unprofitablePositions,
    breakEvenPositions,
    bestPerformer: bestPerformer
      ? {
          entry: bestPerformer.entry,
          coinData: bestPerformer.coinData,
          profitLoss: bestPerformer.profitLoss,
          profitLossPercent: bestPerformer.profitLossPercent!,
        }
      : null,
    worstPerformer: worstPerformer
      ? {
          entry: worstPerformer.entry,
          coinData: worstPerformer.coinData,
          profitLoss: worstPerformer.profitLoss,
          profitLossPercent: worstPerformer.profitLossPercent!,
        }
      : null,
    averageROI,
    largestPosition,
    positions,
  };
}

export const PortfolioPerformanceMetrics: React.FC<PortfolioPerformanceMetricsProps> = ({
  portfolio,
  portfolioCoinsData,
  currency,
}) => {
  if (portfolio.length === 0 || portfolioCoinsData.length === 0) {
    return null;
  }

  const metrics = calculatePerformanceMetrics(portfolio, portfolioCoinsData);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-3 sm:p-4 md:p-5 lg:p-6 pb-2 sm:pb-3">
        <CardTitle className="text-sm sm:text-base md:text-lg flex items-center">
          <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary-600" />
          Portfolio Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-5 lg:p-6 pt-2 sm:pt-3">
        {/* Key Performance Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <MetricCard
            title="Total Portfolio Value"
            value={metrics.totalValue}
            icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />}
            currency={currency}
          />

          {metrics.totalCostBasis > 0 && (
            <>
              <MetricCard
                title="Total Cost Basis"
                value={metrics.totalCostBasis}
                icon={<Target className="h-4 w-4 sm:h-5 sm:w-5" />}
                currency={currency}
              />

              <MetricCard
                title="Total P&L"
                value={metrics.totalProfitLoss}
                change={metrics.totalProfitLossPercent ?? undefined}
                changeType={
                  metrics.totalProfitLoss >= 0
                    ? 'positive'
                    : metrics.totalProfitLoss < 0
                    ? 'negative'
                    : 'neutral'
                }
                icon={
                  metrics.totalProfitLoss >= 0 ? (
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />
                  )
                }
                currency={currency}
                subtitle={
                  metrics.totalProfitLossPercent !== null
                    ? `${metrics.totalProfitLossPercent >= 0 ? '+' : ''}${metrics.totalProfitLossPercent.toFixed(2)}% ROI`
                    : undefined
                }
              />
            </>
          )}

          {metrics.averageROI !== null && (
            <MetricCard
              title="Average ROI"
              value={metrics.averageROI}
              change={metrics.averageROI}
              changeType={
                metrics.averageROI > 0 ? 'positive' : metrics.averageROI < 0 ? 'negative' : 'neutral'
              }
              icon={<Percent className="h-4 w-4 sm:h-5 sm:w-5" />}
              subtitle={`Across ${metrics.positions.length} positions`}
            />
          )}

          <MetricCard
            title="Positions"
            value={metrics.positions.length}
            icon={<PieChart className="h-4 w-4 sm:h-5 sm:w-5" />}
            subtitle={`${metrics.profitablePositions} profitable, ${metrics.unprofitablePositions} unprofitable`}
          />

          {metrics.bestPerformer && (
            <MetricCard
              title="Best Performer"
              value={metrics.bestPerformer.entry.symbol.toUpperCase()}
              change={metrics.bestPerformer.profitLossPercent}
              changeType="positive"
              icon={<Award className="h-4 w-4 sm:h-5 sm:w-5" />}
              subtitle={`${formatCurrency(metrics.bestPerformer.profitLoss, currency)} profit`}
            />
          )}

          {metrics.worstPerformer && (
            <MetricCard
              title="Worst Performer"
              value={metrics.worstPerformer.entry.symbol.toUpperCase()}
              change={metrics.worstPerformer.profitLossPercent}
              changeType="negative"
              icon={<AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />}
              subtitle={`${formatCurrency(Math.abs(metrics.worstPerformer.profitLoss), currency)} loss`}
            />
          )}

          {metrics.largestPosition && (
            <MetricCard
              title="Largest Position"
              value={metrics.largestPosition.entry.symbol.toUpperCase()}
              icon={<PieChart className="h-4 w-4 sm:h-5 sm:w-5" />}
              subtitle={`${metrics.largestPosition.allocationPercent.toFixed(1)}% of portfolio`}
            />
          )}
        </div>

        {/* Portfolio Allocation */}
        {metrics.positions.length > 0 && (
          <div className="mt-4 sm:mt-6">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3 sm:mb-4">
              Portfolio Allocation
            </h3>
            <div className="space-y-2">
              {metrics.positions
                .sort((a, b) => b.allocationPercent - a.allocationPercent)
                .map((position) => (
                  <div
                    key={position.entry.coinId}
                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <img
                          src={sanitizeUrl(position.entry.image)}
                          alt={escapeHtml(position.entry.name)}
                          className="w-6 h-6 rounded-full flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {escapeHtml(position.entry.name)}
                          </div>
                          <div className="text-xs text-gray-500 uppercase">
                            {escapeHtml(position.entry.symbol)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(position.currentValue, currency)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {position.allocationPercent.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(position.allocationPercent, 100)}%` }}
                      />
                    </div>
                    {position.profitLossPercent !== null && (
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className="text-gray-600">P&L:</span>
                        <div className="flex items-center gap-1">
                          {position.profitLoss >= 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                          )}
                          <span
                            className={`font-semibold ${
                              position.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {formatCurrency(Math.abs(position.profitLoss), currency)} (
                            {position.profitLossPercent >= 0 ? '+' : ''}
                            {position.profitLossPercent.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

