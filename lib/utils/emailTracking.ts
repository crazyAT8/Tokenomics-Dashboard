/**
 * Email delivery status tracking utility
 * Uses Redis (with in-memory fallback) to track email delivery status
 */

import { getCache } from '@/lib/cache/cache';
import type { EmailDeliveryRecord, EmailDeliveryStatus } from '@/lib/types';
import { randomBytes } from 'crypto';

const CACHE_NAMESPACE = 'email-tracking';
const DEFAULT_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Generate a unique tracking ID for an email
 */
export function generateTrackingId(): string {
  return `email_${Date.now()}_${randomBytes(8).toString('hex')}`;
}

/**
 * Create a new email delivery record
 */
export async function createEmailRecord(
  to: string,
  subject: string,
  service: 'resend' | 'sendgrid' | 'smtp',
  messageId?: string,
  providerMessageId?: string
): Promise<EmailDeliveryRecord> {
  const cache = getCache();
  const id = generateTrackingId();
  const now = Date.now();

  const record: EmailDeliveryRecord = {
    id,
    to,
    subject,
    status: 'pending',
    service,
    messageId,
    providerMessageId,
    createdAt: now,
    updatedAt: now,
  };

  const cacheKey = `${CACHE_NAMESPACE}:${id}`;
  await cache.set(cacheKey, record, { 
    ttl: DEFAULT_TTL,
    namespace: CACHE_NAMESPACE 
  });

  // Also store by email address for lookup
  const emailKey = `${CACHE_NAMESPACE}:by-email:${to}`;
  const existingRecords = await cache.get<string[]>(emailKey, { namespace: CACHE_NAMESPACE }) || [];
  existingRecords.push(id);
  await cache.set(emailKey, existingRecords, { 
    ttl: DEFAULT_TTL,
    namespace: CACHE_NAMESPACE 
  });

  return record;
}

/**
 * Update email delivery status
 */
export async function updateEmailStatus(
  id: string,
  status: EmailDeliveryStatus,
  metadata?: {
    error?: string;
    deliveredAt?: number;
    openedAt?: number;
    clickedAt?: number;
    retryCount?: number;
    [key: string]: any;
  }
): Promise<EmailDeliveryRecord | null> {
  const cache = getCache();
  const cacheKey = `${CACHE_NAMESPACE}:${id}`;
  
  const record = await cache.get<EmailDeliveryRecord>(cacheKey, { namespace: CACHE_NAMESPACE });
  if (!record) {
    return null;
  }

  const updatedRecord: EmailDeliveryRecord = {
    ...record,
    status,
    updatedAt: Date.now(),
    ...(metadata?.error && { error: metadata.error }),
    ...(metadata?.deliveredAt && { deliveredAt: metadata.deliveredAt }),
    ...(metadata?.openedAt && { openedAt: metadata.openedAt }),
    ...(metadata?.clickedAt && { clickedAt: metadata.clickedAt }),
    ...(metadata?.retryCount !== undefined && { retryCount: metadata.retryCount }),
    ...(metadata && { metadata: { ...record.metadata, ...metadata } }),
  };

  // Update timestamps based on status
  if (status === 'sent' && !updatedRecord.sentAt) {
    updatedRecord.sentAt = Date.now();
  }
  if (status === 'delivered' && !updatedRecord.deliveredAt) {
    updatedRecord.deliveredAt = metadata?.deliveredAt || Date.now();
  }
  if (status === 'opened' && !updatedRecord.openedAt) {
    updatedRecord.openedAt = metadata?.openedAt || Date.now();
  }
  if (status === 'clicked' && !updatedRecord.clickedAt) {
    updatedRecord.clickedAt = metadata?.clickedAt || Date.now();
  }

  await cache.set(cacheKey, updatedRecord, { 
    ttl: DEFAULT_TTL,
    namespace: CACHE_NAMESPACE 
  });

  return updatedRecord;
}

/**
 * Get email delivery record by ID
 */
export async function getEmailRecord(id: string): Promise<EmailDeliveryRecord | null> {
  const cache = getCache();
  const cacheKey = `${CACHE_NAMESPACE}:${id}`;
  return await cache.get<EmailDeliveryRecord>(cacheKey, { namespace: CACHE_NAMESPACE });
}

/**
 * Get email delivery records by email address
 */
export async function getEmailRecordsByAddress(
  email: string,
  limit: number = 50
): Promise<EmailDeliveryRecord[]> {
  const cache = getCache();
  const emailKey = `${CACHE_NAMESPACE}:by-email:${email}`;
  const recordIds = await cache.get<string[]>(emailKey, { namespace: CACHE_NAMESPACE }) || [];
  
  // Get the most recent records (limit)
  const recentIds = recordIds.slice(-limit);
  
  const records = await Promise.all(
    recentIds.map(id => getEmailRecord(id))
  );

  return records.filter((record): record is EmailDeliveryRecord => record !== null);
}

/**
 * Update email status by provider message ID (for webhooks)
 */
export async function updateEmailStatusByProviderId(
  providerMessageId: string,
  status: EmailDeliveryStatus,
  metadata?: Record<string, any>
): Promise<EmailDeliveryRecord | null> {
  const cache = getCache();
  
  // This is a simplified lookup - in production, you might want to maintain
  // a separate index for provider message IDs
  // For now, we'll need to search through records (not ideal for large scale)
  
  // Note: This is a limitation - we'd need to maintain a separate index
  // For now, we'll return null and the webhook handler should use the tracking ID
  // that's embedded in the email headers or metadata
  return null;
}

/**
 * Get email statistics
 */
export async function getEmailStatistics(
  email?: string
): Promise<{
  total: number;
  byStatus: Record<EmailDeliveryStatus, number>;
  byService: Record<'resend' | 'sendgrid' | 'smtp', number>;
}> {
  const records = email 
    ? await getEmailRecordsByAddress(email, 1000)
    : []; // Note: Getting all records is not efficient without a database
  
  const stats = {
    total: records.length,
    byStatus: {
      pending: 0,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      failed: 0,
      complained: 0,
      unsubscribed: 0,
    } as Record<EmailDeliveryStatus, number>,
    byService: {
      resend: 0,
      sendgrid: 0,
      smtp: 0,
    } as Record<'resend' | 'sendgrid' | 'smtp', number>,
  };

  records.forEach(record => {
    stats.byStatus[record.status]++;
    stats.byService[record.service]++;
  });

  return stats;
}

