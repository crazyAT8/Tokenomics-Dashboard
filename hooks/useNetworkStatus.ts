'use client';

import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
}

/**
 * Hook to detect network online/offline status
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof window !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Network came back online
        console.log('Network connection restored');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      console.log('Network connection lost');
    };

    // Set initial state
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also check network status periodically (for cases where events don't fire)
    const checkNetworkStatus = async () => {
      // Only check if navigator.onLine is false, to avoid unnecessary requests
      if (!navigator.onLine) {
        setIsOnline(false);
        setWasOffline(true);
        return;
      }

      try {
        // Try to fetch a small resource to verify connectivity
        // Use a simple HEAD request to a known endpoint
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch('/api/health-check', {
          method: 'HEAD',
          cache: 'no-cache',
          signal: controller.signal,
        }).catch(() => null);
        
        clearTimeout(timeoutId);
        
        if (response && response.ok) {
          setIsOnline(true);
        } else {
          // If health check fails but navigator says online, trust navigator
          setIsOnline(navigator.onLine);
        }
      } catch {
        // On error, trust the navigator.onLine status
        setIsOnline(navigator.onLine);
        if (!navigator.onLine) {
          setWasOffline(true);
        }
      }
    };

    // Check network status every 30 seconds
    const intervalId = setInterval(checkNetworkStatus, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
}

