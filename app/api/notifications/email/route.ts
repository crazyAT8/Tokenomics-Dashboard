import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

/**
 * Email notification API route
 * 
 * This endpoint sends email notifications for price alerts.
 * 
 * To use this, you'll need to configure one of the following:
 * 1. SMTP server (Gmail, Outlook, etc.) - set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 * 2. Resend API - set RESEND_API_KEY
 * 3. SendGrid API - set SENDGRID_API_KEY
 * 
 * For production, consider using a service like Resend, SendGrid, or AWS SES.
 */

interface EmailRequest {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailRequest = await request.json();
    const { to, subject, body: textBody, html } = body;

    // Validate email address
    if (!to || !to.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Check if email service is configured
    const emailService = process.env.EMAIL_SERVICE || 'smtp';
    
    let emailSent = false;
    let error: string | null = null;

    try {
      // Try Resend first (recommended for production)
      if (process.env.RESEND_API_KEY) {
        emailSent = await sendViaResend(to, subject, textBody, html);
      }
      // Try SendGrid
      else if (process.env.SENDGRID_API_KEY) {
        emailSent = await sendViaSendGrid(to, subject, textBody, html);
      }
      // Try SMTP
      else if (
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
      ) {
        emailSent = await sendViaSMTP(to, subject, textBody, html);
      }
      else {
        // In development, just log the email
        console.log('📧 Email Notification (Development Mode):');
        console.log('To:', to);
        console.log('Subject:', subject);
        console.log('Body:', textBody);
        emailSent = true; // Return success in dev mode
      }
    } catch (err: any) {
      error = err.message || 'Failed to send email';
      console.error('Email sending error:', err);
    }

    if (!emailSent && error) {
      return NextResponse.json(
        { error: `Failed to send email: ${error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Email sent successfully',
      service: emailService 
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
 * Send email via Resend API
 */
async function sendViaResend(
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [to],
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>'),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Resend API error: ${response.statusText}`);
  }

  return true;
}

/**
 * Send email via SendGrid API
 */
async function sendViaSendGrid(
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<boolean> {
  const sendGridApiKey = process.env.SENDGRID_API_KEY;
  if (!sendGridApiKey) {
    throw new Error('SENDGRID_API_KEY not configured');
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sendGridApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com' },
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html || text.replace(/\n/g, '<br>') },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SendGrid API error: ${error}`);
  }

  return true;
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
  html?: string
): Promise<boolean> {
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

  // Send email
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html: htmlContent,
      // Add reply-to if configured
      ...(process.env.SMTP_REPLY_TO && { replyTo: process.env.SMTP_REPLY_TO }),
    });

    // Log success (messageId is available in info)
    console.log('Email sent successfully via SMTP:', {
      messageId: info.messageId,
      to,
      subject,
    });

    return true;
  } catch (error: any) {
    // Provide more detailed error information
    const errorMessage = error.response || error.message || 'Unknown error';
    throw new Error(`Failed to send email via SMTP: ${errorMessage}`);
  }
}

