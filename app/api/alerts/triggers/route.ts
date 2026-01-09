import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Alert Trigger Logs API Route
 * 
 * GET: Retrieve trigger logs for alerts
 * Query params:
 *   - alertId: Filter by specific alert ID
 *   - limit: Maximum number of records to return (default: 50)
 *   - offset: Number of records to skip (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('alertId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where: any = {};
    if (alertId) {
      where.alertId = alertId;
    }

    const [logs, total] = await Promise.all([
      prisma.alertTriggerLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
        include: {
          alert: {
            select: {
              id: true,
              coinId: true,
              coinName: true,
              coinSymbol: true,
              coinImage: true,
            },
          },
        },
      }),
      prisma.alertTriggerLog.count({ where }),
    ]);

    return NextResponse.json({
      logs: logs.map((log: any) => ({
        id: log.id,
        alertId: log.alertId,
        alert: log.alert,
        currentPrice: log.currentPrice,
        targetPrice: log.targetPrice,
        type: log.type,
        currency: log.currency,
        emailSent: log.emailSent,
        emailAddress: log.emailAddress,
        browserNotificationSent: log.browserNotificationSent,
        timestamp: log.timestamp,
      })),
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Error fetching trigger logs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch trigger logs' },
      { status: 500 }
    );
  }
}

