import { NextRequest } from 'next/server';

/**
 * Cron Authentication Utility
 * 
 * Validates cron requests from various sources:
 * - Vercel Cron (via x-vercel-cron header)
 * - External cron services (via Authorization header)
 * - Local development (bypasses auth)
 */
export function validateCronRequest(request: NextRequest): {
  valid: boolean;
  source: 'vercel' | 'external' | 'local' | 'unknown';
  error?: string;
} {
  const cronSecret = process.env.CRON_SECRET;
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // In development, allow requests without auth (for local testing)
  if (isDevelopment && !cronSecret) {
    return { valid: true, source: 'local' };
  }

  // Check for Vercel Cron header (automatically added by Vercel)
  const vercelCronHeader = request.headers.get('x-vercel-cron');
  if (vercelCronHeader) {
    return { valid: true, source: 'vercel' };
  }

  // Check for Authorization header (for external cron services)
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${cronSecret}`;
    
    if (authHeader === expectedAuth) {
      return { valid: true, source: 'external' };
    }
    
    if (authHeader) {
      return {
        valid: false,
        source: 'external',
        error: 'Invalid authorization token',
      };
    }
  }

  // If CRON_SECRET is set but no valid auth provided
  if (cronSecret) {
    return {
      valid: false,
      source: 'unknown',
      error: 'Missing or invalid authorization',
    };
  }

  // No secret configured - allow in development, warn in production
  if (isDevelopment) {
    return { valid: true, source: 'local' };
  }

  return {
    valid: false,
    source: 'unknown',
    error: 'Cron authentication not configured',
  };
}

