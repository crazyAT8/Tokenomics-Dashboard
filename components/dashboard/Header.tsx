'use client';

import React from 'react';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  lastUpdated: Date | null;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  isLoading,
  lastUpdated,
}) => {
  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <TrendingUp className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Tokenomics Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              Real-time cryptocurrency tokenomics analysis
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <div className="text-sm text-gray-500">
              Last updated: {formatLastUpdated(lastUpdated)}
            </div>
          )}
          <Button
            onClick={onRefresh}
            isLoading={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    </header>
  );
};
