import { NextRequest } from 'next/server';
import { priceAlertWorker } from '@/lib/workers/priceAlertWorker';
import { createCronHandler } from '@/lib/utils/cronRunner';

/**
 * Cron Job Endpoint for Price Alert Monitoring
 * 
 * This endpoint is called periodically (every minute) to check
 * price alerts and trigger notifications when conditions are met.
 * 
 * Configuration:
 * - Schedule: Defined in vercel.json and lib/utils/cronRegistry.ts
 * - Authentication: Validated via cronAuth utility
 * - Timeout: 60 seconds (configurable in cronRegistry)
 * 
 * For Vercel deployment:
 * - Automatically triggered by Vercel Cron (configured in vercel.json)
 * 
 * For other platforms:
 * - Use external cron service (e.g., cron-job.org, EasyCron)
 * - Set Authorization header: Bearer {CRON_SECRET}
 * 
 * For local development:
 * - Use the dev cron script: npm run dev:cron
 * - Or manually call: GET/POST http://localhost:3000/api/cron/price-alerts
 */
const handler = createCronHandler('price-alerts', async () => {
  // Check if worker is enabled
  if (process.env.ENABLE_PRICE_ALERT_WORKER === 'false') {
    return {
      message: 'Price alert worker is disabled',
      stats: null,
    };
  }

  // Process alerts
  const stats = await priceAlertWorker.processAlerts();

  return {
    message: 'Price alert monitoring completed',
    stats,
  };
});

export async function GET(request: NextRequest) {
  return handler(request);
}

// Also support POST for external cron services
export async function POST(request: NextRequest) {
  return handler(request);
}

