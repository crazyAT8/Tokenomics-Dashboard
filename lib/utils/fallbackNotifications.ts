/**
 * Fallback notification utilities
 * Provides alternative notification methods when email fails
 */

export interface FallbackNotificationOptions {
  to: string;
  subject: string;
  body: string;
  html?: string;
  metadata?: Record<string, any>;
}

export interface FallbackNotificationResult {
  success: boolean;
  method: string;
  error?: string;
}

/**
 * Send notification via webhook (if configured)
 * Useful for integrating with services like Slack, Discord, Microsoft Teams, etc.
 */
async function sendViaWebhook(
  options: FallbackNotificationOptions
): Promise<FallbackNotificationResult> {
  const webhookUrl = process.env.FALLBACK_WEBHOOK_URL;
  if (!webhookUrl) {
    return { success: false, method: 'webhook', error: 'Webhook URL not configured' };
  }

  try {
    const payload = {
      text: options.subject,
      content: options.body,
      html: options.html,
      metadata: options.metadata,
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.FALLBACK_WEBHOOK_AUTH_HEADER && {
          [process.env.FALLBACK_WEBHOOK_AUTH_HEADER]: process.env.FALLBACK_WEBHOOK_AUTH_TOKEN || '',
        }),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return {
        success: false,
        method: 'webhook',
        error: `Webhook request failed: ${errorText}`,
      };
    }

    return { success: true, method: 'webhook' };
  } catch (error: any) {
    return {
      success: false,
      method: 'webhook',
      error: error.message || 'Webhook request failed',
    };
  }
}

/**
 * Send notification via SMS using Twilio (if configured)
 */
async function sendViaSMS(
  options: FallbackNotificationOptions
): Promise<FallbackNotificationResult> {
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
  const recipientPhone = options.metadata?.phoneNumber;

  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    return { success: false, method: 'sms', error: 'Twilio not configured' };
  }

  if (!recipientPhone) {
    return { success: false, method: 'sms', error: 'Phone number not provided' };
  }

  try {
    // Truncate body for SMS (SMS has 160 character limit per message)
    const smsBody = options.body.substring(0, 150) + (options.body.length > 150 ? '...' : '');

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          From: twilioPhoneNumber,
          To: recipientPhone,
          Body: `${options.subject}\n\n${smsBody}`,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        method: 'sms',
        error: `Twilio API error: ${errorData.message || response.statusText}`,
      };
    }

    return { success: true, method: 'sms' };
  } catch (error: any) {
    return {
      success: false,
      method: 'sms',
      error: error.message || 'SMS sending failed',
    };
  }
}

/**
 * Log notification to persistent storage for later retry
 */
async function logForRetry(
  options: FallbackNotificationOptions,
  originalError: string
): Promise<FallbackNotificationResult> {
  try {
    const { getCache } = await import('@/lib/cache/cache');
    const cache = getCache();
    const queueKey = `notification-queue:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const queueItem = {
      ...options,
      originalError,
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: parseInt(process.env.NOTIFICATION_MAX_RETRIES || '5', 10),
    };

    await cache.set(queueKey, queueItem, {
      ttl: 7 * 24 * 60 * 60, // 7 days
      namespace: 'notification-queue',
    });

    // Also add to a list of pending notifications
    const pendingKey = 'notification-queue:pending';
    const pending = (await cache.get<string[]>(pendingKey, { namespace: 'notification-queue' })) || [];
    pending.push(queueKey);
    await cache.set(pendingKey, pending, {
      ttl: 7 * 24 * 60 * 60,
      namespace: 'notification-queue',
    });

    return { success: true, method: 'queue' };
  } catch (error: any) {
    return {
      success: false,
      method: 'queue',
      error: error.message || 'Failed to queue notification',
    };
  }
}

/**
 * Try alternative email providers as fallback
 */
async function tryAlternativeEmailProviders(
  options: FallbackNotificationOptions,
  failedProvider: 'resend' | 'sendgrid' | 'smtp'
): Promise<FallbackNotificationResult> {
  const providers: Array<{ name: 'resend' | 'sendgrid' | 'smtp'; try: () => Promise<FallbackNotificationResult> }> = [];

  // Try Resend if not the failed provider
  if (failedProvider !== 'resend' && process.env.RESEND_API_KEY) {
    providers.push({
      name: 'resend',
      try: async () => {
        try {
          const resendApiKey = process.env.RESEND_API_KEY!;
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
              to: [options.to],
              subject: options.subject,
              text: options.body,
              html: options.html || options.body.replace(/\n/g, '<br>'),
            }),
          });

          if (response.ok) {
            return { success: true, method: 'resend-fallback' };
          }
          const errorData = await response.json().catch(() => ({}));
          return { 
            success: false, 
            method: 'resend-fallback', 
            error: errorData.message || 'Resend API error' 
          };
        } catch (error: any) {
          return { success: false, method: 'resend-fallback', error: error.message };
        }
      },
    });
  }

  // Try SendGrid if not the failed provider
  if (failedProvider !== 'sendgrid' && process.env.SENDGRID_API_KEY) {
    providers.push({
      name: 'sendgrid',
      try: async () => {
        try {
          const sendGridApiKey = process.env.SENDGRID_API_KEY!;
          const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${sendGridApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              personalizations: [{ to: [{ email: options.to }] }],
              from: { email: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com' },
              subject: options.subject,
              content: [
                { type: 'text/plain', value: options.body },
                { type: 'text/html', value: options.html || options.body.replace(/\n/g, '<br>') },
              ],
            }),
          });

          if (response.ok) {
            return { success: true, method: 'sendgrid-fallback' };
          }
          const errorText = await response.text().catch(() => 'SendGrid API error');
          return { success: false, method: 'sendgrid-fallback', error: errorText };
        } catch (error: any) {
          return { success: false, method: 'sendgrid-fallback', error: error.message };
        }
      },
    });
  }

  // Try SMTP if not the failed provider
  if (failedProvider !== 'smtp' && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    providers.push({
      name: 'smtp',
      try: async () => {
        try {
          const nodemailer = await import('nodemailer');
          const port = parseInt(process.env.SMTP_PORT || '587', 10);
          const secure = process.env.SMTP_SECURE === 'true' || port === 465;

          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port,
            secure,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
            tls: {
              rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
            },
          });

          await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: options.to,
            subject: options.subject,
            text: options.body,
            html: options.html || options.body.replace(/\n/g, '<br>'),
          });

          transporter.close();
          return { success: true, method: 'smtp-fallback' };
        } catch (error: any) {
          return { success: false, method: 'smtp-fallback', error: error.message };
        }
      },
    });
  }

  // Try each provider in order
  for (const provider of providers) {
    const result = await provider.try();
    if (result.success) {
      return result;
    }
  }

  return { success: false, method: 'alternative-email', error: 'All alternative email providers failed' };
}

/**
 * Execute fallback notification methods when email fails
 * Tries methods in order of priority:
 * 1. Alternative email providers
 * 2. Webhook notification
 * 3. SMS (if phone number provided)
 * 4. Queue for later retry
 */
export async function executeFallbackNotifications(
  options: FallbackNotificationOptions,
  originalError: string,
  failedProvider: 'resend' | 'sendgrid' | 'smtp'
): Promise<{
  success: boolean;
  methodsAttempted: FallbackNotificationResult[];
  finalResult?: FallbackNotificationResult;
}> {
  const methodsAttempted: FallbackNotificationResult[] = [];
  const fallbackEnabled = process.env.ENABLE_FALLBACK_NOTIFICATIONS !== 'false';

  if (!fallbackEnabled) {
    return {
      success: false,
      methodsAttempted: [],
    };
  }

  // 1. Try alternative email providers first
  const alternativeEmailResult = await tryAlternativeEmailProviders(options, failedProvider);
  methodsAttempted.push(alternativeEmailResult);
  if (alternativeEmailResult.success) {
    return {
      success: true,
      methodsAttempted,
      finalResult: alternativeEmailResult,
    };
  }

  // 2. Try webhook notification
  if (process.env.FALLBACK_WEBHOOK_URL) {
    const webhookResult = await sendViaWebhook(options);
    methodsAttempted.push(webhookResult);
    if (webhookResult.success) {
      return {
        success: true,
        methodsAttempted,
        finalResult: webhookResult,
      };
    }
  }

  // 3. Try SMS if phone number is provided
  if (options.metadata?.phoneNumber && process.env.TWILIO_ACCOUNT_SID) {
    const smsResult = await sendViaSMS(options);
    methodsAttempted.push(smsResult);
    if (smsResult.success) {
      return {
        success: true,
        methodsAttempted,
        finalResult: smsResult,
      };
    }
  }

  // 4. Queue for later retry as last resort
  const queueResult = await logForRetry(options, originalError);
  methodsAttempted.push(queueResult);

  return {
    success: queueResult.success,
    methodsAttempted,
    finalResult: queueResult,
  };
}

