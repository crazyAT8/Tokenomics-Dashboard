/**
 * Data sanitization utilities
 * Provides functions to sanitize user inputs and API responses to prevent XSS, injection attacks, and data corruption
 */

/**
 * Sanitizes a string by removing potentially dangerous characters and trimming whitespace
 * @param input - The string to sanitize
 * @param options - Sanitization options
 * @returns Sanitized string
 */
export function sanitizeString(
  input: string | null | undefined,
  options: {
    maxLength?: number;
    allowSpecialChars?: boolean;
    trim?: boolean;
  } = {}
): string {
  if (input == null) return '';
  
  let sanitized = String(input);
  
  // Trim whitespace by default
  if (options.trim !== false) {
    sanitized = sanitized.trim();
  }
  
  // Remove null bytes and control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Remove potentially dangerous characters if not explicitly allowed
  if (!options.allowSpecialChars) {
    // Remove script tags and event handlers
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/data:text\/html/gi, '');
  }
  
  // Limit length
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }
  
  return sanitized;
}

/**
 * Sanitizes a URL to ensure it's safe
 * @param url - The URL to sanitize
 * @param allowedProtocols - Array of allowed protocols (default: ['http:', 'https:'])
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(
  url: string | null | undefined,
  allowedProtocols: string[] = ['http:', 'https:']
): string {
  if (!url) return '';
  
  const sanitized = sanitizeString(url, { trim: true });
  if (!sanitized) return '';
  
  try {
    const urlObj = new URL(sanitized);
    
    // Check if protocol is allowed
    if (!allowedProtocols.includes(urlObj.protocol.toLowerCase())) {
      return '';
    }
    
    // Reconstruct URL to ensure it's properly formatted
    return urlObj.toString();
  } catch {
    // If URL parsing fails, return empty string
    return '';
  }
}

/**
 * Sanitizes a coin ID (alphanumeric, hyphens, underscores only)
 * @param coinId - The coin ID to sanitize
 * @returns Sanitized coin ID
 */
export function sanitizeCoinId(coinId: string | null | undefined): string {
  if (!coinId) return '';
  
  const sanitized = sanitizeString(coinId, { trim: true, maxLength: 100 });
  
  // Only allow alphanumeric, hyphens, and underscores
  return sanitized.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
}

/**
 * Sanitizes a currency code (3-letter uppercase code)
 * @param currency - The currency code to sanitize
 * @returns Sanitized currency code
 */
export function sanitizeCurrency(currency: string | null | undefined): string {
  if (!currency) return 'usd';
  
  const sanitized = sanitizeString(currency, { trim: true, maxLength: 10 });
  
  // Only allow letters, convert to lowercase
  const cleaned = sanitized.replace(/[^a-zA-Z]/g, '').toLowerCase();
  
  // Default to 'usd' if empty or invalid
  return cleaned || 'usd';
}

/**
 * Sanitizes a search query
 * @param query - The search query to sanitize
 * @param maxLength - Maximum length of the query
 * @returns Sanitized search query
 */
export function sanitizeSearchQuery(
  query: string | null | undefined,
  maxLength: number = 100
): string {
  if (!query) return '';
  
  const sanitized = sanitizeString(query, { trim: true, maxLength });
  
  // Remove excessive whitespace
  return sanitized.replace(/\s+/g, ' ');
}

/**
 * Sanitizes a number, ensuring it's within valid range
 * @param value - The value to sanitize (can be string or number)
 * @param options - Sanitization options
 * @returns Sanitized number or null if invalid
 */
export function sanitizeNumber(
  value: string | number | null | undefined,
  options: {
    min?: number;
    max?: number;
    integer?: boolean;
    allowNegative?: boolean;
  } = {}
): number | null {
  if (value == null) return null;
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num) || !isFinite(num)) {
    return null;
  }
  
  // Check if integer is required
  if (options.integer && !Number.isInteger(num)) {
    return null;
  }
  
  // Check if negative numbers are allowed
  if (!options.allowNegative && num < 0) {
    return null;
  }
  
  // Check min/max bounds
  if (options.min !== undefined && num < options.min) {
    return null;
  }
  
  if (options.max !== undefined && num > options.max) {
    return null;
  }
  
  return options.integer ? Math.floor(num) : num;
}

/**
 * Sanitizes a date string or Date object
 * @param date - The date to sanitize
 * @param options - Sanitization options
 * @returns Sanitized Date or null if invalid
 */
export function sanitizeDate(
  date: string | Date | null | undefined,
  options: {
    minDate?: Date;
    maxDate?: Date;
  } = {}
): Date | null {
  if (!date) return null;
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return null;
    }
    
    // Check min/max bounds
    if (options.minDate && dateObj < options.minDate) {
      return null;
    }
    
    if (options.maxDate && dateObj > options.maxDate) {
      return null;
    }
    
    return dateObj;
  } catch {
    return null;
  }
}

/**
 * Sanitizes an object by recursively sanitizing string values
 * @param obj - The object to sanitize
 * @param options - Sanitization options
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  options: {
    deep?: boolean;
    maxStringLength?: number;
  } = {}
): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
      const value = sanitized[key];
      
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value, {
          maxLength: options.maxStringLength,
        }) as any;
      } else if (options.deep && typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = sanitizeObject(value, options) as any;
      } else if (options.deep && Array.isArray(value)) {
        sanitized[key] = value.map((item) =>
          typeof item === 'string'
            ? sanitizeString(item, { maxLength: options.maxStringLength })
            : typeof item === 'object' && item !== null
            ? sanitizeObject(item, options)
            : item
        ) as any;
      }
    }
  }
  
  return sanitized;
}

/**
 * Escapes HTML special characters to prevent XSS
 * @param input - The string to escape
 * @returns Escaped string safe for HTML display
 */
export function escapeHtml(input: string | null | undefined): string {
  if (!input) return '';
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  
  return String(input).replace(/[&<>"']/g, (char) => map[char] || char);
}

/**
 * Sanitizes data for JSON output (removes circular references and dangerous values)
 * @param data - The data to sanitize
 * @returns Sanitized data safe for JSON serialization
 */
export function sanitizeForJson(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'string') {
    return sanitizeString(data);
  }
  
  if (typeof data === 'number') {
    return isFinite(data) ? data : null;
  }
  
  if (typeof data === 'boolean') {
    return data;
  }
  
  if (data instanceof Date) {
    return data.toISOString();
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeForJson);
  }
  
  if (typeof data === 'object') {
    const sanitized: Record<string, any> = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        // Skip functions and symbols
        if (typeof data[key] === 'function' || typeof data[key] === 'symbol') {
          continue;
        }
        sanitized[sanitizeString(key)] = sanitizeForJson(data[key]);
      }
    }
    return sanitized;
  }
  
  return null;
}

