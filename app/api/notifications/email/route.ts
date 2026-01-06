import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { retry, RetryOptions } from '@/lib/utils/retry';
import { 
  createEmailRecord, 
  updateEmailStatus, 
  generateTrackingId 
} from '@/lib/utils/emailTracking';

/**
 * Email notification API route
 * 
 * This endpoint sends email notifications for price alerts with automatic retry logic.
 * 
 * To use this, you'll need to configure one of the following:
 * 1. SMTP server (Gmail, Outlook, etc.) - set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 * 2. Resend API - set RESEND_API_KEY
 * 3. SendGrid API - set SENDGRID_API_KEY
 * 
 * For production, consider using a service like Resend, SendGrid, or AWS SES.
 * 
 * Retry Configuration (Optional):
 * - EMAIL_RETRY_MAX_ATTEMPTS: Maximum number of retry attempts (default: 3)
 * - EMAIL_RETRY_INITIAL_DELAY: Initial delay in milliseconds before first retry (default: 1000)
 * - EMAIL_RETRY_MAX_DELAY: Maximum delay in milliseconds between retries (default: 10000)
 * 
 * The retry logic uses exponential backoff and automatically retries on:
 * - Network errors (timeouts, connection refused, etc.)
 * - Server errors (500, 502, 503, 504)
 * - Rate limit errors (429) with longer delays
 * - Request timeout errors (408)
 */

interface EmailRequest {
  to: string;
  subject: string;
  body: string;
  html?: string;
  trackingId?: string; // Optional: use existing tracking ID for retries
}

interface EmailSendResult {
  success: boolean;
  messageId?: string;
  providerMessageId?: string;
  error?: string;
}

/**
 * Get retry configuration from environment variables
 */
function getRetryConfig(): RetryOptions {
  return {
    maxRetries: parseInt(process.env.EMAIL_RETRY_MAX_ATTEMPTS || '3', 10),
    initialDelay: parseInt(process.env.EMAIL_RETRY_INITIAL_DELAY || '1000', 10),
    maxDelay: parseInt(process.env.EMAIL_RETRY_MAX_DELAY || '10000', 10),
    retryableStatuses: [408, 429, 500, 502, 503, 504], // Include 429 for rate limits
    retryableErrors: ['ECONNABORTED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET', 'ECONNREFUSED'],
  };
}

/**
 * Normalize error for retry detection
 * Converts various error formats to a consistent structure
 */
function normalizeErrorForRetry(error: any): any {
  // If error already has response structure, return as is
  if (error.response) {
    return error;
  }

  // Check if it's a fetch Response error
  if (error.status) {
    return {
      ...error,
      response: {
        status: error.status,
        statusText: error.statusText,
      },
    };
  }

  // Check for HTTP status codes in error message
  const statusMatch = error.message?.match(/(\d{3})/);
  if (statusMatch) {
    const status = parseInt(statusMatch[1], 10);
    if (status >= 400) {
      return {
        ...error,
        response: {
          status,
        },
      };
    }
  }

  // Check for timeout errors
  if (
    error.message?.includes('timeout') ||
    error.message?.includes('TIMEOUT') ||
    error.message?.includes('timed out')
  ) {
    return {
      ...error,
      code: 'ETIMEDOUT',
    };
  }

  // Check for connection errors
  if (
    error.message?.includes('ECONNREFUSED') ||
    error.message?.includes('ECONNRESET') ||
    error.message?.includes('ENOTFOUND')
  ) {
    return {
      ...error,
      code: error.message.match(/E[A-Z]+/)?.[0] || 'ECONNREFUSED',
    };
  }

  return error;
}

/**
 * Health check endpoint for email service
 * Checks connectivity and authentication for all configured email services
 */
export async function GET() {
  const healthStatus = {
    status: 'ok' as 'ok' | 'degraded' | 'error',
    timestamp: new Date().toISOString(),
    services: {
      resend: { configured: false, healthy: false, error: null as string | null },
      sendgrid: { configured: false, healthy: false, error: null as string | null },
      smtp: { configured: false, healthy: false, error: null as string | null },
    },
    configuredServices: [] as string[],
    healthyServices: [] as string[],
  };

  // Check Resend
  if (process.env.RESEND_API_KEY) {
    healthStatus.services.resend.configured = true;
    healthStatus.configuredServices.push('resend');
    try {
      await checkResendHealth();
      healthStatus.services.resend.healthy = true;
      healthStatus.healthyServices.push('resend');
    } catch (error: any) {
      healthStatus.services.resend.error = error.message || 'Health check failed';
      healthStatus.status = 'degraded';
    }
  }

  // Check SendGrid
  if (process.env.SENDGRID_API_KEY) {
    healthStatus.services.sendgrid.configured = true;
    healthStatus.configuredServices.push('sendgrid');
    try {
      await checkSendGridHealth();
      healthStatus.services.sendgrid.healthy = true;
      healthStatus.healthyServices.push('sendgrid');
    } catch (error: any) {
      healthStatus.services.sendgrid.error = error.message || 'Health check failed';
      healthStatus.status = 'degraded';
    }
  }

  // Check SMTP
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    healthStatus.services.smtp.configured = true;
    healthStatus.configuredServices.push('smtp');
    try {
      await checkSMTPHealth();
      healthStatus.services.smtp.healthy = true;
      healthStatus.healthyServices.push('smtp');
    } catch (error: any) {
      healthStatus.services.smtp.error = error.message || 'Health check failed';
      healthStatus.status = 'degraded';
    }
  }

  // If no services are configured, return error status
  if (healthStatus.configuredServices.length === 0) {
    healthStatus.status = 'error';
    return NextResponse.json(
      {
        ...healthStatus,
        message: 'No email service configured. Please configure at least one email service.',
      },
      { status: 503 }
    );
  }

  // If no services are healthy, return error status
  if (healthStatus.healthyServices.length === 0) {
    healthStatus.status = 'error';
    return NextResponse.json(
      {
        ...healthStatus,
        message: 'All configured email services are unhealthy.',
      },
      { status: 503 }
    );
  }

  // Return appropriate status code based on health
  const statusCode = healthStatus.status === 'ok' ? 200 : 200; // Return 200 even for degraded, but status field indicates issue
  return NextResponse.json(healthStatus, { status: statusCode });
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailRequest = await request.json();
    const { to, subject, body: textBody, html, trackingId } = body;

    // Validate email address
    if (!to || !to.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Determine which email service to use
    let emailService: 'resend' | 'sendgrid' | 'smtp' = 'smtp';
    if (process.env.RESEND_API_KEY) {
      emailService = 'resend';
    } else if (process.env.SENDGRID_API_KEY) {
      emailService = 'sendgrid';
    } else if (
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    ) {
      emailService = 'smtp';
    }

    // Create or get tracking record
    let trackingRecord;
    if (trackingId) {
      // Use existing tracking record for retries
      const { getEmailRecord } = await import('@/lib/utils/emailTracking');
      trackingRecord = await getEmailRecord(trackingId);
      if (!trackingRecord) {
        return NextResponse.json(
          { error: 'Invalid tracking ID' },
          { status: 400 }
        );
      }
    } else {
      // Create new tracking record
      trackingRecord = await createEmailRecord(to, subject, emailService);
    }

    let result: EmailSendResult = { success: false };
    let error: string | undefined = undefined;

    try {
      // Try Resend first (recommended for production)
      if (process.env.RESEND_API_KEY) {
        result = await sendViaResend(to, subject, textBody, html, trackingRecord.id);
      }
      // Try SendGrid
      else if (process.env.SENDGRID_API_KEY) {
        result = await sendViaSendGrid(to, subject, textBody, html, trackingRecord.id);
      }
      // Try SMTP
      else if (
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
      ) {
        result = await sendViaSMTP(to, subject, textBody, html, trackingRecord.id);
      }
      else {
        // In development, just log the email
        console.log('📧 Email Notification (Development Mode):');
        console.log('To:', to);
        console.log('Subject:', subject);
        console.log('Body:', textBody);
        result = { success: true }; // Return success in dev mode
      }
    } catch (err: any) {
      error = err.message || 'Failed to send email';
      console.error('Email sending error:', err);
      result = { success: false, error };
    }

    // Update tracking record based on result
    if (result.success) {
      await updateEmailStatus(trackingRecord.id, 'sent', {
        messageId: result.messageId,
        providerMessageId: result.providerMessageId,
      });
    } else {
      const retryCount = (trackingRecord.retryCount || 0) + 1;
      await updateEmailStatus(trackingRecord.id, 'failed', {
        error: result.error || error || 'Failed to send email',
        retryCount,
      });
    }

    if (!result.success && error) {
      return NextResponse.json(
        { 
          error: `Failed to send email: ${error}`,
          trackingId: trackingRecord.id,
          status: 'failed'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Email sent successfully',
      service: emailService,
      trackingId: trackingRecord.id,
      messageId: result.messageId,
      status: 'sent'
    });
  } catch (error: any) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Health check for Resend API
 */
async function checkResendHealth(): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }

  // Verify API key by checking domains (lightweight endpoint)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

  try {
    const response = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Invalid API key or insufficient permissions');
      }
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Resend API error: ${error.message || response.statusText}`);
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Resend API health check timed out');
    }
    throw error;
  }
}

/**
 * Health check for SendGrid API
 */
async function checkSendGridHealth(): Promise<void> {
  const sendGridApiKey = process.env.SENDGRID_API_KEY;
  if (!sendGridApiKey) {
    throw new Error('SENDGRID_API_KEY not configured');
  }

  // Verify API key by checking user profile (lightweight endpoint)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

  try {
    const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sendGridApiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Invalid API key or insufficient permissions');
      }
      const error = await response.text();
      throw new Error(`SendGrid API error: ${error}`);
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('SendGrid API health check timed out');
    }
    throw error;
  }
}

/**
 * Health check for SMTP service
 */
async function checkSMTPHealth(): Promise<void> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error('SMTP configuration incomplete');
  }

  // Parse port
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid SMTP_PORT: ${process.env.SMTP_PORT}`);
  }

  // Determine secure mode
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port,
    secure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
    },
  });

  // Verify connection (this tests authentication)
  // Add timeout to prevent hanging
  const verifyPromise = transporter.verify();
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('SMTP health check timed out')), 10000)
  );

  try {
    await Promise.race([verifyPromise, timeoutPromise]);
  } catch (error: any) {
    throw new Error(`SMTP connection verification failed: ${error.message}`);
  } finally {
    // Close the connection
    transporter.close();
  }
}

/**
 * Send email via Resend API with retry logic
 */
async function sendViaResend(
  to: string,
  subject: string,
  text: string,
  html?: string,
  trackingId?: string
): Promise<EmailSendResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }

  const retryConfig = getRetryConfig();
  
  try {
    const result = await retry(async () => {
      const emailPayload: any = {
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: [to],
        subject,
        text,
        html: html || text.replace(/\n/g, '<br>'),
      };

      // Add tracking ID to headers for webhook matching
      if (trackingId) {
        emailPayload.headers = {
          'X-Tracking-ID': trackingId,
        };
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: any = new Error(errorData.message || `Resend API error: ${response.statusText}`);
        error.status = response.status;
        error.statusText = response.statusText;
        throw normalizeErrorForRetry(error);
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.id,
        providerMessageId: data.id,
      };
    }, retryConfig);

    return result as EmailSendResult;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to send email via Resend',
    };
  }
}

/**
 * Send email via SendGrid API with retry logic
 */
async function sendViaSendGrid(
  to: string,
  subject: string,
  text: string,
  html?: string,
  trackingId?: string
): Promise<EmailSendResult> {
  const sendGridApiKey = process.env.SENDGRID_API_KEY;
  if (!sendGridApiKey) {
    throw new Error('SENDGRID_API_KEY not configured');
  }

  const retryConfig = getRetryConfig();
  
  try {
    const result = await retry(async () => {
      const emailPayload: any = {
        personalizations: [{ to: [{ email: to }] }],
        from: { email: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com' },
        subject,
        content: [
          { type: 'text/plain', value: text },
          { type: 'text/html', value: html || text.replace(/\n/g, '<br>') },
        ],
      };

      // Add tracking ID to custom headers for webhook matching
      if (trackingId) {
        emailPayload.custom_args = {
          tracking_id: trackingId,
        };
      }

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendGridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error: any = new Error(`SendGrid API error: ${errorText}`);
        error.status = response.status;
        error.statusText = response.statusText;
        throw normalizeErrorForRetry(error);
      }

      // SendGrid returns message ID in X-Message-Id header
      const messageId = response.headers.get('X-Message-Id') || undefined;
      
      return {
        success: true,
        messageId,
        providerMessageId: messageId,
      };
    }, retryConfig);

    return result as EmailSendResult;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to send email via SendGrid',
    };
  }
}

/**
 * Send email via SMTP using nodemailer
 * 
 * Required environment variables:
 * - SMTP_HOST: SMTP server hostname (e.g., smtp.gmail.com)
 * - SMTP_PORT: SMTP server port (e.g., 587 for TLS, 465 for SSL)
 * - SMTP_USER: SMTP username/email
 * - SMTP_PASS: SMTP password or app-specific password
 * 
 * Optional environment variables:
 * - SMTP_SECURE: Set to 'true' for SSL (port 465), 'false' for STARTTLS (port 587)
 * - SMTP_FROM: From email address (defaults to SMTP_USER)
 * - SMTP_NAME: Display name for the sender
 */
async function sendViaSMTP(
  to: string,
  subject: string,
  text: string,
  html?: string,
  trackingId?: string
): Promise<EmailSendResult> {
  // Validate required environment variables
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error(
      'SMTP configuration incomplete. Required: SMTP_HOST, SMTP_USER, SMTP_PASS'
    );
  }

  // Parse port (default: 587 for STARTTLS)
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid SMTP_PORT: ${process.env.SMTP_PORT}. Must be between 1 and 65535.`);
  }

  // Determine secure mode
  // Port 465 typically uses SSL, port 587 uses STARTTLS
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port,
    secure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    // Additional options for better compatibility
    tls: {
      // Do not fail on invalid certificates (useful for self-signed certs in dev)
      rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
    },
  });

  // Verify connection
  try {
    await transporter.verify();
  } catch (error: any) {
    throw new Error(`SMTP connection verification failed: ${error.message}`);
  }

  // Prepare email options
  const fromEmail = process.env.SMTP_FROM || smtpUser;
  const fromName = process.env.SMTP_NAME;
  const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

  // Generate HTML if not provided
  const htmlContent = html || text.replace(/\n/g, '<br>');

  // Send email with retry logic
  const retryConfig = getRetryConfig();
  
  try {
    const result = await retry(async () => {
      try {
        const mailOptions: any = {
          from,
          to,
          subject,
          text,
          html: htmlContent,
          // Add reply-to if configured
          ...(process.env.SMTP_REPLY_TO && { replyTo: process.env.SMTP_REPLY_TO }),
        };

        // Add tracking ID to headers for webhook matching (if supported by provider)
        if (trackingId) {
          mailOptions.headers = {
            'X-Tracking-ID': trackingId,
          };
        }

        const info = await transporter.sendMail(mailOptions);

        // Log success (messageId is available in info)
        console.log('Email sent successfully via SMTP:', {
          messageId: info.messageId,
          to,
          subject,
        });

        return {
          success: true,
          messageId: info.messageId,
          providerMessageId: info.messageId,
        };
      } catch (error: any) {
        // Normalize error for retry detection
        throw normalizeErrorForRetry(error);
      }
    }, retryConfig);

    return result as EmailSendResult;
  } catch (error: any) {
    // Provide more detailed error information
    const errorMessage = error.response || error.message || 'Unknown error';
    return {
      success: false,
      error: `Failed to send email via SMTP: ${errorMessage}`,
    };
  }
}

