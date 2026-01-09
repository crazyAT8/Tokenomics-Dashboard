import { NextRequest, NextResponse } from 'next/server';
import { priceAlertWorker } from '@/lib/workers/priceAlertWorker';

/**
 * Cron Job Endpoint for Price Alert Monitoring
 * 
 * This endpoint should be called periodically (e.g., every minute) to check
 * price alerts and trigger notifications when conditions are met.
 * 
 * For Vercel deployment:
 * - Configure in vercel.json with cron schedule
 * - Or use Vercel Cron Jobs dashboard
 * 
 * For other platforms:
 * - Use external cron service (e.g., cron-job.org, EasyCron)
 * - Or set up a scheduled task that calls this endpoint
 * 
 * Security:
 * - This endpoint should be protected with a secret token
 * - Set CRON_SECRET environment variable and verify it in the request
 * 
 * Example cron schedule: */1 * * * * (every minute)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // If CRON_SECRET is set, require authentication
    if (cronSecret) {
      const expectedAuth = `Bearer ${cronSecret}`;
      if (authHeader !== expectedAuth) {
        // Also check for Vercel Cron header
        const cronHeader = request.headers.get('x-vercel-cron');
        if (!cronHeader) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }
      }
    }

    // Check if worker is enabled
    if (process.env.ENABLE_PRICE_ALERT_WORKER === 'false') {
      return NextResponse.json({
        success: true,
        message: 'Price alert worker is disabled',
        stats: null,
      });
    }

    console.log('⏰ Cron job triggered: Price alert monitoring');

    // Process alerts
    const stats = await priceAlertWorker.processAlerts();

    return NextResponse.json({
      success: true,
      message: 'Price alert monitoring completed',
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in price alert cron job:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for external cron services
export async function POST(request: NextRequest) {
  return GET(request);
}

