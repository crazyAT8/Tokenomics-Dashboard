/**
 * Resend webhook endpoint for email delivery status updates
 * 
 * Configure this URL in your Resend dashboard:
 * https://your-domain.com/api/notifications/email/webhook/resend
 * 
 * Resend webhook events:
 * - email.sent
 * - email.delivered
 * - email.delivery_delayed
 * - email.complained
 * - email.bounced
 * - email.opened
 * - email.clicked
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateEmailStatus } from '@/lib/utils/emailTracking';
import type { EmailDeliveryStatus } from '@/lib/types';

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    [key: string]: any;
  };
}

const RESEND_EVENT_STATUS_MAP: Record<string, EmailDeliveryStatus> = {
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.delivery_delayed': 'pending',
  'email.complained': 'complained',
  'email.bounced': 'bounced',
  'email.opened': 'opened',
  'email.clicked': 'clicked',
};

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature if configured
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get('svix-signature');
      if (!signature) {
        return NextResponse.json(
          { error: 'Missing webhook signature' },
          { status: 401 }
        );
      }
      // Note: In production, verify the signature using svix library
      // For now, we'll skip verification if secret is not set
    }

    const body = await request.json();
    const event = body as ResendWebhookEvent;

    // Extract tracking ID from email metadata or headers
    // Resend allows custom headers, so we can embed tracking ID in headers
    const providerMessageId = event.data.email_id;
    const trackingId = event.data.headers?.['X-Tracking-ID'] || event.data.tags?.tracking_id;
    
    if (!providerMessageId) {
      return NextResponse.json(
        { error: 'Missing email_id in webhook data' },
        { status: 400 }
      );
    }

    // Map Resend event type to our status
    const status = RESEND_EVENT_STATUS_MAP[event.type] || 'sent';
    
    // Parse timestamps
    const createdAt = new Date(event.created_at).getTime();
    const deliveredAt = status === 'delivered' ? createdAt : undefined;
    const openedAt = status === 'opened' ? createdAt : undefined;
    const clickedAt = status === 'clicked' ? createdAt : undefined;

    // Try to find record by tracking ID first, then by provider message ID
    const { getEmailRecord, getEmailRecordsByAddress } = await import('@/lib/utils/emailTracking');
    let record = trackingId ? await getEmailRecord(trackingId) : null;
    
    if (!record) {
      // Fallback: search by email address and match provider ID
      const records = await getEmailRecordsByAddress(event.data.to[0] || '', 100);
      record = records.find(r => 
        r.providerMessageId === providerMessageId || 
        r.messageId === providerMessageId
      ) || null;
    }

    if (!record) {
      console.warn(`Email record not found for provider message ID: ${providerMessageId}`);
      // Still return success to prevent webhook retries
      return NextResponse.json({ success: true, message: 'Record not found' });
    }

    // Update the record
    await updateEmailStatus(record.id, status, {
      deliveredAt,
      openedAt,
      clickedAt,
      metadata: {
        ...event.data,
        webhookReceivedAt: Date.now(),
      },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Webhook processed successfully',
      trackingId: record.id,
      status,
    });
  } catch (error: any) {
    console.error('Resend webhook error:', error);
    // Return 200 to prevent webhook retries for processing errors
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 200 }
    );
  }
}

// Support GET for webhook verification (some services use GET)
export async function GET() {
  return NextResponse.json({ 
    message: 'Resend webhook endpoint',
    method: 'POST',
  });
}

