import { NextRequest, NextResponse } from 'next/server';
import { PriceAlert } from '@/lib/types';
import { getCache } from '@/lib/cache/cache';

const ALERTS_STORAGE_KEY = 'price-alerts:all';
const ALERTS_TTL = 365 * 24 * 60 * 60; // 1 year TTL for alerts

/**
 * Price Alerts API Route
 * 
 * Manages server-side storage of price alerts for background monitoring.
 * This complements the client-side localStorage storage and enables
 * server-side alert monitoring even when the browser is closed.
 * 
 * GET: Retrieve all alerts or a specific alert
 * POST: Create a new alert
 * PUT: Update an existing alert
 * DELETE: Delete an alert
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('id');
    const cache = getCache();

    const allAlerts = (await cache.get<PriceAlert[]>(ALERTS_STORAGE_KEY, {
      namespace: 'alerts',
    })) || [];

    if (alertId) {
      const alert = allAlerts.find(a => a.id === alertId);
      if (!alert) {
        return NextResponse.json(
          { error: 'Alert not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(alert);
    }

    return NextResponse.json(allAlerts);
  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cache = getCache();

    // Validate required fields
    if (!body.coinId || !body.targetPrice || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: coinId, targetPrice, type' },
        { status: 400 }
      );
    }

    // Generate alert ID if not provided
    const alertId = body.id || `${body.coinId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newAlert: PriceAlert = {
      id: alertId,
      coinId: body.coinId,
      coinName: body.coinName || body.coinId,
      coinSymbol: body.coinSymbol || body.coinId.toUpperCase(),
      coinImage: body.coinImage || '',
      targetPrice: parseFloat(body.targetPrice),
      type: body.type, // 'above' or 'below'
      currency: body.currency || 'usd',
      isActive: body.isActive !== undefined ? body.isActive : true,
      createdAt: body.createdAt || Date.now(),
      triggeredAt: body.triggeredAt,
      note: body.note,
      emailNotification: body.emailNotification,
      emailAddress: body.emailAddress,
      browserNotification: body.browserNotification,
    };

    // Get existing alerts
    const allAlerts = (await cache.get<PriceAlert[]>(ALERTS_STORAGE_KEY, {
      namespace: 'alerts',
    })) || [];

    // Check if alert with same ID already exists
    const existingIndex = allAlerts.findIndex(a => a.id === alertId);
    if (existingIndex >= 0) {
      return NextResponse.json(
        { error: 'Alert with this ID already exists' },
        { status: 409 }
      );
    }

    // Add new alert
    allAlerts.push(newAlert);

    // Save back to cache
    await cache.set(ALERTS_STORAGE_KEY, allAlerts, {
      namespace: 'alerts',
      ttl: ALERTS_TTL,
    });

    return NextResponse.json(newAlert, { status: 201 });
  } catch (error: any) {
    console.error('Error creating alert:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create alert' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const cache = getCache();

    if (!body.id) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    // Get existing alerts
    const allAlerts = (await cache.get<PriceAlert[]>(ALERTS_STORAGE_KEY, {
      namespace: 'alerts',
    })) || [];

    const alertIndex = allAlerts.findIndex(a => a.id === body.id);
    if (alertIndex < 0) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    // Update alert
    allAlerts[alertIndex] = {
      ...allAlerts[alertIndex],
      ...body,
      id: allAlerts[alertIndex].id, // Prevent ID changes
    };

    // Save back to cache
    await cache.set(ALERTS_STORAGE_KEY, allAlerts, {
      namespace: 'alerts',
      ttl: ALERTS_TTL,
    });

    return NextResponse.json(allAlerts[alertIndex]);
  } catch (error: any) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update alert' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('id');
    const cache = getCache();

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    // Get existing alerts
    const allAlerts = (await cache.get<PriceAlert[]>(ALERTS_STORAGE_KEY, {
      namespace: 'alerts',
    })) || [];

    const alertIndex = allAlerts.findIndex(a => a.id === alertId);
    if (alertIndex < 0) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    // Remove alert
    allAlerts.splice(alertIndex, 1);

    // Save back to cache
    await cache.set(ALERTS_STORAGE_KEY, allAlerts, {
      namespace: 'alerts',
      ttl: ALERTS_TTL,
    });

    return NextResponse.json({ success: true, message: 'Alert deleted' });
  } catch (error: any) {
    console.error('Error deleting alert:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete alert' },
      { status: 500 }
    );
  }
}

