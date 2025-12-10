'use client';

import React from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

interface NetworkStatusProps {
  isOnline: boolean;
  wasOffline: boolean;
  className?: string;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({
  isOnline,
  wasOffline,
  className = '',
}) => {
  if (!wasOffline && isOnline) {
    return null; // Don't show anything when everything is normal
  }

  return (
    <div
      className={`flex items-center space-x-2 px-3 py-2 rounded-md ${
        isOnline
          ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/40 dark:text-green-100 dark:border-green-800'
          : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/40 dark:text-red-100 dark:border-red-800'
      } ${className}`}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span className="text-sm font-medium">Connection restored</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">No internet connection</span>
        </>
      )}
    </div>
  );
};

