'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { TokenomicsChart } from '@/components/charts/TokenomicsChart';
import { TokenomicsData } from '@/lib/types';
import { 
  Coins, 
  TrendingUp, 
  DollarSign, 
  BarChart3,
  Users,
  Activity
} from 'lucide-react';

interface TokenomicsOverviewProps {
  tokenomics: TokenomicsData;
}

export const TokenomicsOverview: React.FC<TokenomicsOverviewProps> = ({
  tokenomics,
}) => {
  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toLocaleString();
  };

  const supplyUtilization = tokenomics.max_supply 
    ? (tokenomics.circulating_supply / tokenomics.max_supply) * 100 
    : 100;

  const metrics = [
    {
      title: 'Market Cap',
      value: tokenomics.market_cap,
      icon: <DollarSign className="h-5 w-5" />,
      change: tokenomics.price_change_percentage_24h,
    },
    {
      title: 'Circulating Supply',
      value: tokenomics.circulating_supply,
      icon: <Coins className="h-5 w-5" />,
      subtitle: `${supplyUtilization.toFixed(1)}% of max supply`,
    },
    {
      title: 'Total Supply',
      value: tokenomics.total_supply || tokenomics.circulating_supply,
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: 'Max Supply',
      value: tokenomics.max_supply || 'Unlimited',
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      title: '24h Volume',
      value: tokenomics.volume_24h,
      icon: <Activity className="h-5 w-5" />,
    },
    {
      title: 'Market Cap Rank',
      value: `#${tokenomics.market_cap_rank}`,
      icon: <Users className="h-5 w-5" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {metric.title}
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {typeof metric.value === 'number' 
                      ? formatNumber(metric.value) 
                      : metric.value
                    }
                  </p>
                  {metric.subtitle && (
                    <p className="text-xs text-gray-500 mt-1">
                      {metric.subtitle}
                    </p>
                  )}
                </div>
                <div className="text-primary-500">
                  {metric.icon}
                </div>
              </div>
              {metric.change !== undefined && (
                <div className={`flex items-center mt-2 ${
                  metric.change >= 0 ? 'text-crypto-green' : 'text-crypto-red'
                }`}>
                  <span className="text-sm font-medium">
                    {metric.change >= 0 ? '+' : ''}{metric.change.toFixed(2)}%
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Supply Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Supply Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <TokenomicsChart data={tokenomics} />
        </CardContent>
      </Card>
    </div>
  );
};
