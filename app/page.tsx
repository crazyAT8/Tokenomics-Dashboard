'use client';

import React from 'react';
import { useDashboardStore } from '@/lib/store';
import { useCoinData } from '@/hooks/useCoinData';
import { Header } from '@/components/dashboard/Header';
import { CoinSelector } from '@/components/dashboard/CoinSelector';
import { PriceChart } from '@/components/charts/PriceChart';
import { TokenomicsOverview } from '@/components/dashboard/TokenomicsOverview';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Activity,
  AlertCircle
} from 'lucide-react';

export default function Dashboard() {
  const { selectedCoin, setSelectedCoin } = useDashboardStore();
  const { marketData, isLoading, error, refreshData } = useCoinData();

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Error Loading Data
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onRefresh={refreshData}
        isLoading={isLoading}
        lastUpdated={marketData ? new Date() : null}
      />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Coin Selector */}
        <div className="mb-8">
          <CoinSelector
            selectedCoin={selectedCoin}
            onCoinSelect={setSelectedCoin}
          />
        </div>

        {isLoading && !marketData ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading coin data...</p>
            </div>
          </div>
        ) : marketData ? (
          <>
            {/* Price Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <img
                        src={marketData.coin.image}
                        alt={marketData.coin.name}
                        className="w-8 h-8 mr-3 rounded-full"
                      />
                      {marketData.coin.name} Price Chart
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PriceChart data={marketData.priceHistory} />
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-4">
                <MetricCard
                  title="Current Price"
                  value={marketData.coin.current_price}
                  change={marketData.coin.price_change_percentage_24h}
                  changeType={marketData.coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}
                  icon={<DollarSign className="h-5 w-5" />}
                />
                
                <MetricCard
                  title="Market Cap"
                  value={marketData.coin.market_cap}
                  change={marketData.coin.market_cap_change_percentage_24h}
                  changeType={marketData.coin.market_cap_change_percentage_24h >= 0 ? 'positive' : 'negative'}
                  icon={<BarChart3 className="h-5 w-5" />}
                />
                
                <MetricCard
                  title="24h Volume"
                  value={marketData.coin.total_volume}
                  icon={<Activity className="h-5 w-5" />}
                />
                
                <MetricCard
                  title="24h High"
                  value={marketData.coin.high_24h}
                  icon={<TrendingUp className="h-5 w-5" />}
                />
                
                <MetricCard
                  title="24h Low"
                  value={marketData.coin.low_24h}
                  icon={<TrendingDown className="h-5 w-5" />}
                />
              </div>
            </div>

            {/* Tokenomics Overview */}
            <TokenomicsOverview tokenomics={marketData.tokenomics} />
          </>
        ) : null}
      </main>
    </div>
  );
}
