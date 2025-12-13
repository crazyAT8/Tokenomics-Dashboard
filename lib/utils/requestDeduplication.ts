/**
 * Request deduplication utility
 * Prevents multiple simultaneous requests for the same resource
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class RequestDeduplicator {
  private pendingRequests: Map<string, PendingRequest<any>> = new Map();
  private readonly MAX_AGE = 5000; // 5 seconds - max age for pending request tracking

  /**
   * Deduplicate a request by key
   * If a request with the same key is already pending, returns the existing promise
   * Otherwise, executes the request function and tracks it
   */
  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Clean up old pending requests
    this.cleanup();

    // Check if there's already a pending request for this key
    const existing = this.pendingRequests.get(key);
    if (existing) {
      console.log(`Request deduplication: reusing pending request for key: ${key}`);
      return existing.promise;
    }

    // Create new request
    const promise = requestFn().finally(() => {
      // Remove from pending requests when done (success or error)
      this.pendingRequests.delete(key);
    });

    // Track the pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    });

    return promise;
  }

  /**
   * Check if a request is currently pending
   */
  isPending(key: string): boolean {
    this.cleanup();
    return this.pendingRequests.has(key);
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.clear();
  }

  /**
   * Remove old pending requests that are older than MAX_AGE
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.MAX_AGE) {
        this.pendingRequests.delete(key);
      }
    }
  }
}

// Export singleton instance
export const requestDeduplicator = new RequestDeduplicator();

/**
 * Generate a cache key for request deduplication
 */
export function generateRequestKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${JSON.stringify(params[key])}`)
    .join('|');
  
  return `${prefix}:${sortedParams}`;
}

