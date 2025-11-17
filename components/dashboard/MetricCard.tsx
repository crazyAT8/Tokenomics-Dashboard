'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  subtitle?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  subtitle,
}) => {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
      if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
      if (val >= 1e3) return `$${(val / 1e3).toFixed(2)}K`;
      return `$${val.toFixed(2)}`;
    }
    return val;
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive':
        return <TrendingUp className="h-4 w-4" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-crypto-green';
      case 'negative':
        return 'text-crypto-red';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card className="hover:shadow-md active:shadow-sm transition-all duration-200 touch-manipulation">
      <CardContent className="p-4 sm:p-5 lg:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 break-words">
              {formatValue(value)}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className="ml-3 sm:ml-4 text-primary-500 flex-shrink-0">
              {icon}
            </div>
          )}
        </div>
        {change !== undefined && (
          <div className={`flex items-center mt-2 ${getChangeColor()}`}>
            {getChangeIcon()}
            <span className="ml-1 text-xs sm:text-sm font-medium">
              {change > 0 ? '+' : ''}{change.toFixed(2)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
