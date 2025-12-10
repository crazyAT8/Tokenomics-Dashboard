'use client';

import { useEffect, useRef, useCallback } from 'react';
import { PriceAlert } from '@/lib/types';
import { usePriceAlerts } from './usePriceAlerts';
import { showPriceAlertNotification } from '@/lib/utils/notifications';
import { formatCurrency } from '@/lib/utils/currency';

/**
 * Hook to monitor price alerts and trigger notifications
 * Checks prices periodically and sends email/browser notifications when alerts are triggered
 */
export function usePriceAlertMonitor() {
  const { alerts, getActiveAlerts, markAlertAsTriggered } = usePriceAlerts();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const checkedAlertsRef = useRef<Set<string>>(new Set());

  /**
   * Check if an alert should be triggered based on current price
   */
  const checkAlert = useCallback(async (alert: PriceAlert, currentPrice: number) => {
    // Skip if already triggered
    if (alert.triggeredAt) {
      return;
    }

    // Check if price condition is met
    const shouldTrigger = alert.type === 'above' 
      ? currentPrice >= alert.targetPrice
      : currentPrice <= alert.targetPrice;

    if (!shouldTrigger) {
      return;
    }

    // Mark alert as triggered
    markAlertAsTriggered(alert.id);

    // Send browser notification if enabled
    if (alert.browserNotification) {
      try {
        await showPriceAlertNotification(
          alert.coinName,
          alert.coinSymbol,
          alert.targetPrice,
          currentPrice,
          alert.type,
          alert.currency,
          alert.coinImage
        );
      } catch (error) {
        console.error('Failed to show browser notification:', error);
      }
    }

    // Send email notification if enabled
    if (alert.emailNotification && alert.emailAddress) {
      try {
        const subject = `Price Alert: ${alert.coinName} (${alert.coinSymbol.toUpperCase()})`;
        const direction = alert.type === 'above' ? 'above' : 'below';
        const body = `
Price Alert Triggered!

${alert.coinName} (${alert.coinSymbol.toUpperCase()}) has reached ${direction} your target price.

Target Price: ${formatCurrency(alert.targetPrice, alert.currency)}
Current Price: ${formatCurrency(currentPrice, alert.currency)}
Direction: ${alert.type === 'above' ? 'Above' : 'Below'}

${alert.note ? `Note: ${alert.note}\n` : ''}

This alert was created on ${new Date(alert.createdAt).toLocaleString()}.
        `.trim();

        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Price Alert Triggered!</h2>
            <p><strong>${alert.coinName}</strong> (${alert.coinSymbol.toUpperCase()}) has reached ${direction} your target price.</p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 8px 0;"><strong>Target Price:</strong> ${formatCurrency(alert.targetPrice, alert.currency)}</p>
              <p style="margin: 8px 0;"><strong>Current Price:</strong> ${formatCurrency(currentPrice, alert.currency)}</p>
              <p style="margin: 8px 0;"><strong>Direction:</strong> ${alert.type === 'above' ? 'Above' : 'Below'}</p>
            </div>
            ${alert.note ? `<p style="font-style: italic; color: #6b7280;">Note: ${alert.note}</p>` : ''}
            <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
              This alert was created on ${new Date(alert.createdAt).toLocaleString()}.
            </p>
          </div>
        `;

        const response = await fetch('/api/notifications/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: alert.emailAddress,
            subject,
            body,
            html,
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || 'Failed to send email');
        }
      } catch (error) {
        console.error('Failed to send email notification:', error);
      }
    }
  }, [markAlertAsTriggered]);

  /**
   * Fetch current price for a coin
   */
  const fetchCoinPrice = useCallback(async (coinId: string, currency: string): Promise<number | null> => {
    try {
      const response = await fetch(`/api/coins/search?ids=${encodeURIComponent(coinId)}&limit=1`);
      if (!response.ok) {
        throw new Error('Failed to fetch coin price');
      }
      const data = await response.json();
      const coin = data.find((c: any) => c.id === coinId);
      return coin?.current_price || null;
    } catch (error) {
      console.error(`Error fetching price for ${coinId}:`, error);
      return null;
    }
  }, []);

  /**
   * Check all active alerts
   */
  const checkAllAlerts = useCallback(async () => {
    const activeAlerts = getActiveAlerts();
    
    if (activeAlerts.length === 0) {
      return;
    }

    // Group alerts by coin to minimize API calls
    const alertsByCoin = new Map<string, PriceAlert[]>();
    activeAlerts.forEach(alert => {
      const key = `${alert.coinId}-${alert.currency}`;
      if (!alertsByCoin.has(key)) {
        alertsByCoin.set(key, []);
      }
      alertsByCoin.get(key)!.push(alert);
    });

    // Check each coin's alerts
    for (const [key, coinAlerts] of alertsByCoin.entries()) {
      const [coinId, currency] = key.split('-');
      const currentPrice = await fetchCoinPrice(coinId, currency);
      
      if (currentPrice === null) {
        continue;
      }

      // Check each alert for this coin
      for (const alert of coinAlerts) {
        await checkAlert(alert, currentPrice);
      }
    }
  }, [getActiveAlerts, fetchCoinPrice, checkAlert]);

  /**
   * Start monitoring alerts
   */
  useEffect(() => {
    // Check alerts immediately
    checkAllAlerts();

    // Then check every 30 seconds
    intervalRef.current = setInterval(() => {
      checkAllAlerts();
    }, 30000); // 30 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkAllAlerts]);

  return {
    checkAllAlerts,
  };
}

