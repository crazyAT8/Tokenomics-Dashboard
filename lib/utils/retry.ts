/**
 * Retry utility with exponential backoff
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableStatuses?: number[];
  retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableStatuses: [408, 500, 502, 503, 504], // Removed 429 - handle separately
  retryableErrors: ['ECONNABORTED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET'],
};

/**
 * Checks if an error is retryable based on status code or error code
 */
function isRetryableError(error: any, options: Required<RetryOptions>): boolean {
  // Check for network errors
  if (error.code && options.retryableErrors.includes(error.code)) {
    return true;
  }

  // Check for HTTP status codes (support both error.response.status and error.status)
  const statusCode = error.response?.status || error.status;
  if (statusCode && options.retryableStatuses.includes(statusCode)) {
    return true;
  }

  // Check for timeout errors
  if (error.message?.includes('timeout') || error.message?.includes('TIMEOUT')) {
    return true;
  }

  // Don't retry client errors (4xx) except for specific ones in retryableStatuses
  if (statusCode >= 400 && statusCode < 500) {
    return options.retryableStatuses.includes(statusCode);
  }

  return false;
}

/**
 * Calculates delay for the next retry attempt using exponential backoff
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>, isRateLimit: boolean = false): number {
  // For rate limit errors (429), use much longer delays
  if (isRateLimit) {
    // Start with 60 seconds for rate limits, then double
    const rateLimitDelay = 60000 * Math.pow(2, attempt);
    return Math.min(rateLimitDelay, 300000); // Max 5 minutes
  }
  
  const delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt);
  return Math.min(delay, options.maxDelay);
}

/**
 * Sleeps for the specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      const isRateLimit = error.response?.status === 429 || error.status === 429;
      
      // Check if error is retryable
      const shouldRetry = isRetryableError(error, opts);
      
      // Don't retry if it's the last attempt or error is not retryable
      if (attempt === opts.maxRetries || !shouldRetry) {
        throw error;
      }

      // Calculate delay - use longer delays for rate limit errors
      const delay = calculateDelay(attempt, opts, isRateLimit && shouldRetry);
      console.log(
        `Retry attempt ${attempt + 1}/${opts.maxRetries} after ${delay}ms delay. Error:`,
        error.message || error
      );
      await sleep(delay);
    }
  }

  throw lastError;
}

