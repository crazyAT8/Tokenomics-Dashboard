import { PriceAlert } from '@/lib/types';
import { prisma } from '@/lib/db';
import { formatCurrency } from '@/lib/utils/currency';
import { Currency } from '@/lib/store';

// Helper function to convert Prisma model to PriceAlert type
function prismaToPriceAlert(prismaAlert: any): PriceAlert {
  return {
    id: prismaAlert.id,
    coinId: prismaAlert.coinId,
    coinName: prismaAlert.coinName,
    coinSymbol: prismaAlert.coinSymbol,
    coinImage: prismaAlert.coinImage,
    targetPrice: prismaAlert.targetPrice,
    type: prismaAlert.type as 'above' | 'below',
    currency: prismaAlert.currency as PriceAlert['currency'],
    isActive: prismaAlert.isActive,
    createdAt: prismaAlert.createdAt,
    triggeredAt: prismaAlert.triggeredAt ?? undefined,
    note: prismaAlert.note ?? undefined,
    emailNotification: prismaAlert.emailNotification ?? undefined,
    emailAddress: prismaAlert.emailAddress ?? undefined,
    browserNotification: prismaAlert.browserNotification ?? undefined,
  };
}

interface AlertCheckResult {
  alertId: string;
  triggered: boolean;
  currentPrice?: number;
  error?: string;
}

interface WorkerStats {
  totalAlerts: number;
  activeAlerts: number;
  checkedAlerts: number;
  triggeredAlerts: number;
  errors: number;
  duration: number;
}

/**
 * Price Alert Worker
 * 
 * Monitors price alerts and triggers notifications when conditions are met.
 * This worker is designed to run as a background job (via cron or scheduled task).
 * 
 * Features:
 * - Batches coin price requests to minimize API calls
 * - Groups alerts by coin and currency for efficiency
 * - Handles rate limiting gracefully
 * - Sends email notifications when alerts are triggered
 * - Marks alerts as triggered to prevent duplicate notifications
 */
export class PriceAlertWorker {
  /**
   * Get all active alerts that haven't been triggered
   */
  async getActiveAlerts(): Promise<PriceAlert[]> {
    try {
      const alerts = await prisma.priceAlert.findMany({
        where: {
          isActive: true,
          triggeredAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return alerts.map(prismaToPriceAlert);
    } catch (error) {
      console.error('Error fetching active alerts:', error);
      return [];
    }
  }

  /**
   * Check if an alert condition is met
   */
  private shouldTriggerAlert(alert: PriceAlert, currentPrice: number): boolean {
    if (alert.triggeredAt) {
      return false; // Already triggered
    }

    if (alert.type === 'above') {
      return currentPrice >= alert.targetPrice;
    } else {
      return currentPrice <= alert.targetPrice;
    }
  }

  /**
   * Mark an alert as triggered
   */
  async markAlertAsTriggered(alertId: string, currentPrice: number, emailSent: boolean, emailAddress?: string, browserNotificationSent: boolean = false): Promise<void> {
    try {
      const alert = await prisma.priceAlert.findUnique({
        where: { id: alertId },
      });

      if (!alert) {
        throw new Error(`Alert ${alertId} not found`);
      }

      const timestamp = Date.now();

      // Update alert
      await prisma.priceAlert.update({
        where: { id: alertId },
        data: {
          triggeredAt: timestamp,
          isActive: false,
        },
      });

      // Log trigger event
      await prisma.alertTriggerLog.create({
        data: {
          alertId: alertId,
          currentPrice: currentPrice,
          targetPrice: alert.targetPrice,
          type: alert.type,
          currency: alert.currency,
          emailSent: emailSent,
          emailAddress: emailAddress ?? null,
          browserNotificationSent: browserNotificationSent,
          timestamp: timestamp,
        },
      });
    } catch (error) {
      console.error(`Error marking alert ${alertId} as triggered:`, error);
    }
  }

  /**
   * Send email notification for triggered alert
   */
  private async sendEmailNotification(
    alert: PriceAlert,
    currentPrice: number
  ): Promise<boolean> {
    if (!alert.emailNotification || !alert.emailAddress) {
      return false;
    }

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

      // Use internal API endpoint to send email
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000';
      
      const response = await fetch(`${baseUrl}/api/notifications/email`, {
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

      return true;
    } catch (error) {
      console.error(`Error sending email notification for alert ${alert.id}:`, error);
      return false;
    }
  }

  /**
   * Check a single alert against current price
   */
  async checkAlert(alert: PriceAlert, currentPrice: number): Promise<AlertCheckResult> {
    try {
      const shouldTrigger = this.shouldTriggerAlert(alert, currentPrice);

      if (!shouldTrigger) {
        return {
          alertId: alert.id,
          triggered: false,
          currentPrice,
        };
      }

      // Send email notification if enabled
      let emailSent = false;
      if (alert.emailNotification) {
        emailSent = await this.sendEmailNotification(alert, currentPrice);
      }

      // Mark as triggered and log the event
      await this.markAlertAsTriggered(
        alert.id,
        currentPrice,
        emailSent,
        alert.emailAddress,
        alert.browserNotification || false
      );

      const currency = alert.currency as Currency;
      console.log(`✅ Alert triggered: ${alert.coinName} (${alert.coinSymbol}) - ${alert.type} ${formatCurrency(alert.targetPrice, currency)} (Current: ${formatCurrency(currentPrice, currency)})`);

      return {
        alertId: alert.id,
        triggered: true,
        currentPrice,
      };
    } catch (error: any) {
      console.error(`Error checking alert ${alert.id}:`, error);
      return {
        alertId: alert.id,
        triggered: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Fetch current prices for multiple coins
   * Groups by currency to minimize API calls
   */
  private async fetchCoinPrices(
    coinIds: string[],
    currency: string
  ): Promise<Map<string, number>> {
    const priceMap = new Map<string, number>();

    if (coinIds.length === 0) {
      return priceMap;
    }

    try {
      // Fetch prices using the API
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000';
      
      const response = await fetch(
        `${baseUrl}/api/coins/search?ids=${coinIds.map(id => encodeURIComponent(id)).join(',')}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.statusText}`);
      }

      const coins = await response.json();
      
      // Map prices by coin ID
      for (const coin of coins) {
        if (coin.id && coin.current_price !== undefined) {
          priceMap.set(coin.id, coin.current_price);
        }
      }
    } catch (error) {
      console.error(`Error fetching prices for coins ${coinIds.join(',')}:`, error);
    }

    return priceMap;
  }

  /**
   * Process all active alerts
   * This is the main worker function that should be called by the cron job
   */
  async processAlerts(): Promise<WorkerStats> {
    const startTime = Date.now();
    const stats: WorkerStats = {
      totalAlerts: 0,
      activeAlerts: 0,
      checkedAlerts: 0,
      triggeredAlerts: 0,
      errors: 0,
      duration: 0,
    };

    try {
      console.log('🔍 Starting price alert monitoring...');

      // Get all active alerts
      const activeAlerts = await this.getActiveAlerts();
      stats.totalAlerts = activeAlerts.length;
      stats.activeAlerts = activeAlerts.length;

      if (activeAlerts.length === 0) {
        console.log('✅ No active alerts to monitor');
        stats.duration = Date.now() - startTime;
        return stats;
      }

      // Group alerts by coin and currency to minimize API calls
      const alertsByCoin = new Map<string, PriceAlert[]>();
      for (const alert of activeAlerts) {
        const key = `${alert.coinId}-${alert.currency}`;
        if (!alertsByCoin.has(key)) {
          alertsByCoin.set(key, []);
        }
        alertsByCoin.get(key)!.push(alert);
      }

      console.log(`📊 Monitoring ${activeAlerts.length} alerts across ${alertsByCoin.size} unique coins`);

      // Process each group
      const coinEntries = Array.from(alertsByCoin.entries());
      for (const [key, coinAlerts] of coinEntries) {
        const [coinId, currency] = key.split('-');
        
        try {
          // Fetch current price for this coin
          const prices = await this.fetchCoinPrices([coinId], currency);
          const currentPrice = prices.get(coinId);

          if (currentPrice === undefined) {
            console.warn(`⚠️ Could not fetch price for ${coinId} in ${currency}`);
            stats.errors++;
            continue;
          }

          // Check each alert for this coin
          for (const alert of coinAlerts) {
            stats.checkedAlerts++;
            const result = await this.checkAlert(alert, currentPrice);
            
            if (result.triggered) {
              stats.triggeredAlerts++;
            }
            
            if (result.error) {
              stats.errors++;
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error: any) {
          console.error(`Error processing alerts for ${coinId}:`, error);
          stats.errors += coinAlerts.length;
        }
      }

      stats.duration = Date.now() - startTime;
      console.log(`✅ Price alert monitoring completed in ${stats.duration}ms`);
      console.log(`   - Checked: ${stats.checkedAlerts} alerts`);
      console.log(`   - Triggered: ${stats.triggeredAlerts} alerts`);
      console.log(`   - Errors: ${stats.errors}`);

      return stats;
    } catch (error: any) {
      console.error('Error in price alert worker:', error);
      stats.errors++;
      stats.duration = Date.now() - startTime;
      return stats;
    }
  }
}

// Export singleton instance
export const priceAlertWorker = new PriceAlertWorker();

