/**
 * Email delivery status query API
 * GET /api/notifications/email/status?id=<trackingId> - Get status by tracking ID
 * GET /api/notifications/email/status?email=<email> - Get all records for an email address
 * GET /api/notifications/email/status?stats=true&email=<email> - Get statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getEmailRecord, 
  getEmailRecordsByAddress,
  getEmailStatistics 
} from '@/lib/utils/emailTracking';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const email = searchParams.get('email');
    const stats = searchParams.get('stats') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Get statistics
    if (stats) {
      const statistics = await getEmailStatistics(email || undefined);
      return NextResponse.json({
        success: true,
        statistics,
      });
    }

    // Get by tracking ID
    if (id) {
      const record = await getEmailRecord(id);
      if (!record) {
        return NextResponse.json(
          { error: 'Email record not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        record,
      });
    }

    // Get by email address
    if (email) {
      const records = await getEmailRecordsByAddress(email, limit);
      return NextResponse.json({
        success: true,
        records,
        count: records.length,
      });
    }

    // No parameters provided
    return NextResponse.json(
      { error: 'Please provide either id, email, or stats parameter' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Email status API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

