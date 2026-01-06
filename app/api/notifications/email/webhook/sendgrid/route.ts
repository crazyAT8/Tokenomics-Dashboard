/**
 * SendGrid webhook endpoint for email delivery status updates
 * 
 * Configure this URL in your SendGrid dashboard:
 * https://your-domain.com/api/notifications/email/webhook/sendgrid
 * 
 * SendGrid webhook events:
 * - processed
 * - delivered
 * - deferred
 * - bounce
 * - dropped
 * - open
 * - click
 * - spamreport
 * - unsubscribe
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateEmailStatus } from '@/lib/utils/emailTracking';
import type { EmailDeliveryStatus } from '@/lib/types';

interface SendGridWebhookEvent {
  email: string;
  timestamp: number;
  event: string;
  sg_message_id?: string;
  sg_event_id?: string;
  reason?: string;
  status?: string;
  [key: string]: any;
}

const SENDGRID_EVENT_STATUS_MAP: Record<string, EmailDeliveryStatus> = {
  'processed': 'sent',
  'delivered': 'delivered',
  'deferred': 'pending',
  'bounce': 'bounced',
  'dropped': 'failed',
  'open': 'opened',
  'click': 'clicked',
  'spamreport': 'complained',
  'unsubscribe': 'unsubscribed',
};

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature if configured
    const webhookSecret = process.env.SENDGRID_WEBHOOK_SECRET;
    if (webhookSecret) {
      // SendGrid uses HMAC-SHA256 signature verification
      // For now, we'll skip verification if secret is not set
      // In production, verify using SendGrid's verification method
    }

    const body = await request.json();
    
    // SendGrid sends events as an array
    const events = Array.isArray(body) ? body : [body];
    
    const results = [];

    for (const event of events) {
      const sgEvent = event as SendGridWebhookEvent;
      
      if (!sgEvent.email || !sgEvent.event) {
        console.warn('Invalid SendGrid webhook event:', sgEvent);
        continue;
      }

      // Map SendGrid event type to our status
      const status = SENDGRID_EVENT_STATUS_MAP[sgEvent.event] || 'sent';
      
      // Parse timestamp (SendGrid uses Unix timestamp)
      const eventTimestamp = sgEvent.timestamp * 1000; // Convert to milliseconds
      const deliveredAt = status === 'delivered' ? eventTimestamp : undefined;
      const openedAt = status === 'opened' ? eventTimestamp : undefined;
      const clickedAt = status === 'clicked' ? eventTimestamp : undefined;

      // Extract message ID and tracking ID
      const providerMessageId = sgEvent.sg_message_id;
      const trackingId = sgEvent.custom_args?.tracking_id || sgEvent.unique_arg?.tracking_id;

      // Try to find record by tracking ID first, then by provider message ID
      const { getEmailRecord, getEmailRecordsByAddress } = await import('@/lib/utils/emailTracking');
      let record = trackingId ? await getEmailRecord(trackingId) : null;
      
      if (!record) {
        // Fallback: search by email address and match provider ID
        const records = await getEmailRecordsByAddress(sgEvent.email, 100);
        record = records.find(r => 
          providerMessageId && (
            r.providerMessageId === providerMessageId || 
            r.messageId === providerMessageId
          )
        ) || records[0]; // Fallback to most recent if no match
      }

      if (!record) {
        console.warn(`Email record not found for SendGrid event: ${sgEvent.email}`);
        results.push({ 
          success: false, 
          message: 'Record not found',
          event: sgEvent.event,
        });
        continue;
      }

      // Update the record
      await updateEmailStatus(record.id, status, {
        deliveredAt,
        openedAt,
        clickedAt,
        error: sgEvent.reason || sgEvent.status === '5.0.0' ? sgEvent.reason : undefined,
        metadata: {
          ...sgEvent,
          webhookReceivedAt: Date.now(),
        },
      });

      results.push({
        success: true,
        trackingId: record.id,
        status,
        event: sgEvent.event,
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Webhook processed successfully',
      results,
      processed: results.length,
    });
  } catch (error: any) {
    console.error('SendGrid webhook error:', error);
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
    message: 'SendGrid webhook endpoint',
    method: 'POST',
  });
}

