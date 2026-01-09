import { NextRequest, NextResponse } from 'next/server';
import { PriceAlert } from '@/lib/types';
import { prisma } from '@/lib/db';

/**
 * Price Alerts API Route
 * 
 * Manages server-side storage of price alerts for background monitoring.
 * Uses database storage for persistent, reliable alert management.
 * 
 * GET: Retrieve all alerts or a specific alert
 * POST: Create a new alert
 * PUT: Update an existing alert
 * DELETE: Delete an alert
 */

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

// Helper function to log alert history
async function logAlertHistory(
  alertId: string,
  action: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated',
  changes?: Record<string, any>
): Promise<void> {
  try {
    await prisma.alertHistory.create({
      data: {
        alertId,
        action,
        changes: changes ? JSON.stringify(changes) : null,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error(`Error logging alert history for ${alertId}:`, error);
    // Don't throw - history logging shouldn't break the main operation
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('id');

    if (alertId) {
      const alert = await prisma.priceAlert.findUnique({
        where: { id: alertId },
      });

      if (!alert) {
        return NextResponse.json(
          { error: 'Alert not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(prismaToPriceAlert(alert));
    }

    const allAlerts = await prisma.priceAlert.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(allAlerts.map(prismaToPriceAlert));
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

    // Validate required fields
    if (!body.coinId || !body.targetPrice || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: coinId, targetPrice, type' },
        { status: 400 }
      );
    }

    // Validate type
    if (body.type !== 'above' && body.type !== 'below') {
      return NextResponse.json(
        { error: 'Invalid type. Must be "above" or "below"' },
        { status: 400 }
      );
    }

    // Check if alert with same ID already exists (if ID provided)
    if (body.id) {
      const existing = await prisma.priceAlert.findUnique({
        where: { id: body.id },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'Alert with this ID already exists' },
          { status: 409 }
        );
      }
    }

    const newAlert = await prisma.priceAlert.create({
      data: {
        id: body.id, // Will use UUID if not provided
        coinId: body.coinId,
        coinName: body.coinName || body.coinId,
        coinSymbol: body.coinSymbol || body.coinId.toUpperCase(),
        coinImage: body.coinImage || '',
        targetPrice: parseFloat(body.targetPrice),
        type: body.type,
        currency: body.currency || 'usd',
        isActive: body.isActive !== undefined ? body.isActive : true,
        createdAt: body.createdAt || Date.now(),
        triggeredAt: body.triggeredAt ?? null,
        note: body.note ?? null,
        emailNotification: body.emailNotification ?? false,
        emailAddress: body.emailAddress ?? null,
        browserNotification: body.browserNotification ?? false,
      },
    });

    // Log creation
    await logAlertHistory(newAlert.id, 'created', {
      coinId: newAlert.coinId,
      targetPrice: newAlert.targetPrice,
      type: newAlert.type,
      currency: newAlert.currency,
    });

    return NextResponse.json(prismaToPriceAlert(newAlert), { status: 201 });
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

    if (!body.id) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    // Check if alert exists
    const existing = await prisma.priceAlert.findUnique({
      where: { id: body.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    // Track changes for history
    const changes: Record<string, any> = {};
    
    // Prepare update data (exclude id from updates)
    const updateData: any = {};
    if (body.coinId !== undefined) {
      updateData.coinId = body.coinId;
      changes.coinId = body.coinId;
    }
    if (body.coinName !== undefined) {
      updateData.coinName = body.coinName;
      changes.coinName = body.coinName;
    }
    if (body.coinSymbol !== undefined) {
      updateData.coinSymbol = body.coinSymbol;
      changes.coinSymbol = body.coinSymbol;
    }
    if (body.coinImage !== undefined) {
      updateData.coinImage = body.coinImage;
      changes.coinImage = body.coinImage;
    }
    if (body.targetPrice !== undefined) {
      updateData.targetPrice = parseFloat(body.targetPrice);
      changes.targetPrice = parseFloat(body.targetPrice);
    }
    if (body.type !== undefined) {
      updateData.type = body.type;
      changes.type = body.type;
    }
    if (body.currency !== undefined) {
      updateData.currency = body.currency;
      changes.currency = body.currency;
    }
    if (body.isActive !== undefined) {
      const wasActive = existing.isActive;
      updateData.isActive = body.isActive;
      changes.isActive = body.isActive;
      // Log activation/deactivation separately
      if (wasActive !== body.isActive) {
        await logAlertHistory(body.id, body.isActive ? 'activated' : 'deactivated');
      }
    }
    if (body.createdAt !== undefined) updateData.createdAt = body.createdAt;
    if (body.triggeredAt !== undefined) updateData.triggeredAt = body.triggeredAt ?? null;
    if (body.note !== undefined) {
      updateData.note = body.note ?? null;
      changes.note = body.note ?? null;
    }
    if (body.emailNotification !== undefined) {
      updateData.emailNotification = body.emailNotification;
      changes.emailNotification = body.emailNotification;
    }
    if (body.emailAddress !== undefined) {
      updateData.emailAddress = body.emailAddress ?? null;
      changes.emailAddress = body.emailAddress ?? null;
    }
    if (body.browserNotification !== undefined) {
      updateData.browserNotification = body.browserNotification;
      changes.browserNotification = body.browserNotification;
    }

    const updatedAlert = await prisma.priceAlert.update({
      where: { id: body.id },
      data: updateData,
    });

    // Log update if there were changes (excluding isActive which is logged separately)
    const changesWithoutActive = { ...changes };
    delete changesWithoutActive.isActive;
    if (Object.keys(changesWithoutActive).length > 0) {
      await logAlertHistory(body.id, 'updated', changesWithoutActive);
    }

    return NextResponse.json(prismaToPriceAlert(updatedAlert));
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

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    // Check if alert exists
    const existing = await prisma.priceAlert.findUnique({
      where: { id: alertId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    // Log deletion before deleting
    await logAlertHistory(alertId, 'deleted', {
      coinId: existing.coinId,
      coinName: existing.coinName,
      targetPrice: existing.targetPrice,
    });

    await prisma.priceAlert.delete({
      where: { id: alertId },
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

