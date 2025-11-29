'use client';

import React from 'react';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NetworkStatus } from '@/components/ui/NetworkStatus';

interface HeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  lastUpdated: Date | null;
  networkStatus?: {
    isOnline: boolean;
    wasOffline: boolean;
  };
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  isLoading,
  lastUpdated,
  networkStatus,
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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 md:gap-4">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="p-1.5 sm:p-2 bg-primary-100 rounded-lg flex-shrink-0">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                Tokenomics Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block truncate">
                Real-time cryptocurrency tokenomics analysis
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-2 sm:gap-3 md:gap-4 w-full sm:w-auto">
            {networkStatus && (
              <div className="hidden md:block">
                <NetworkStatus
                  isOnline={networkStatus.isOnline}
                  wasOffline={networkStatus.wasOffline}
                />
              </div>
            )}
            {lastUpdated && (
              <div className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                <span className="hidden md:inline">Last updated: </span>
                <span>{formatLastUpdated(lastUpdated)}</span>
              </div>
            )}
            <Button
              onClick={onRefresh}
              isLoading={isLoading}
              variant="outline"
              size="sm"
              disabled={networkStatus && !networkStatus.isOnline}
              className="min-h-[44px] min-w-[44px] sm:min-h-[32px] touch-manipulation active:scale-95 transition-transform"
            >
              <RefreshCw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            {networkStatus && (
              <div className="md:hidden">
                <NetworkStatus
                  isOnline={networkStatus.isOnline}
                  wasOffline={networkStatus.wasOffline}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
