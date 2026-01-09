import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Alert History API Route
 * 
 * GET: Retrieve alert history for a specific alert or all alerts
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

    const [history, total] = await Promise.all([
      prisma.alertHistory.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.alertHistory.count({ where }),
    ]);

    return NextResponse.json({
      history: history.map((item) => ({
        id: item.id,
        alertId: item.alertId,
        action: item.action,
        changes: item.changes ? JSON.parse(item.changes) : null,
        timestamp: item.timestamp,
      })),
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Error fetching alert history:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch alert history' },
      { status: 500 }
    );
  }
}

