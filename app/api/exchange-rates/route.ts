import { NextRequest, NextResponse } from 'next/server';
import { fetchExchangeRates } from '@/lib/api';
import { validateExchangeRates } from '@/lib/validation/validators';
import { sanitizeCurrency } from '@/lib/utils/sanitize';
import { getCache } from '@/lib/cache/cache';
import { CacheManager } from '@/lib/cache/cache';
import { requestDeduplicator, generateRequestKey } from '@/lib/utils/requestDeduplication';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Sanitize base currency parameter
    const baseCurrency = sanitizeCurrency(searchParams.get('base'));
    
    // Generate cache key
    const cacheKey = CacheManager.generateCacheKey('exchange-rates', { base: baseCurrency });
    
    // Try cache first
    const cache = getCache();
    const cachedRates = await cache.get(cacheKey);
    
    // Check if data needs refresh (stale-while-revalidate pattern)
    const needsRefresh = await cache.needsRefresh(cacheKey);
    
    if (cachedRates) {
      console.log('Cache hit for exchange rates:', baseCurrency, needsRefresh ? '(needs refresh)' : '');
      
      // If data needs refresh, trigger background refresh (non-blocking)
      if (needsRefresh) {
        const requestKey = generateRequestKey('exchange-rates-fetch', { base: baseCurrency });
        // Fire and forget - refresh in background
        requestDeduplicator.deduplicate(
          requestKey,
          async () => {
            try {
              const freshRates = await fetchExchangeRates(baseCurrency);
              const validatedRates = validateExchangeRates(freshRates);
              await cache.set(cacheKey, validatedRates, { 
                ttl: 900, // 15 minutes
                refreshInterval: 600 // Refresh after 10 minutes
              });
            } catch (error) {
              console.error('Background refresh failed for exchange rates:', error);
            }
          }
        ).catch(err => console.error('Background refresh error:', err));
      }
      
      return NextResponse.json(cachedRates);
    }

    console.log('Cache miss for exchange rates - fetching from API');
    
    // Use request deduplication to prevent duplicate simultaneous requests
    const requestKey = generateRequestKey('exchange-rates-fetch', { base: baseCurrency });
    const exchangeRates = await requestDeduplicator.deduplicate(
      requestKey,
      () => fetchExchangeRates(baseCurrency)
    );
    
    // Validate the exchange rates before sending (extra safety layer)
    const validatedExchangeRates = validateExchangeRates(exchangeRates);
    
    // Cache exchange rates for 15 minutes, refresh after 10 minutes
    await cache.set(cacheKey, validatedExchangeRates, { 
      ttl: 900, // 15 minutes
      refreshInterval: 600 // Refresh after 10 minutes
    });
    
    return NextResponse.json(validatedExchangeRates);
  } catch (error: any) {
    console.error('API Error:', error);
    const statusCode = error.parsedError?.statusCode || error.response?.status || 500;
    const errorMessage = error.parsedError?.message || error.message || 'Failed to fetch exchange rates';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        retryable: error.parsedError?.retryable || false,
      },
      { status: statusCode }
    );
  }
}

