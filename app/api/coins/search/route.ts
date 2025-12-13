import { NextRequest, NextResponse } from 'next/server';
import { searchCoins, fetchTopCoins, fetchCoinsByIds } from '@/lib/api';
import { sanitizeSearchQuery, sanitizeNumber, sanitizeCoinId } from '@/lib/utils/sanitize';
import { getCache } from '@/lib/cache/cache';
import { CacheManager } from '@/lib/cache/cache';
import { requestDeduplicator, generateRequestKey } from '@/lib/utils/requestDeduplication';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cache = getCache();
    
    // Check for IDs parameter (comma-separated list of coin IDs)
    const idsParam = searchParams.get('ids');
    
    if (idsParam) {
      // Fetch coins by IDs
      const ids = idsParam.split(',').map(id => sanitizeCoinId(id.trim())).filter(Boolean) as string[];
      if (ids.length > 0) {
        // Generate cache key for IDs lookup
        const cacheKey = CacheManager.generateCacheKey('coins-by-ids', { ids: ids.sort().join(',') });
        
        // Try cache first
        const cachedCoins = await cache.get(cacheKey);
        if (cachedCoins) {
          console.log('Cache hit for coins by IDs:', ids.length);
          return NextResponse.json(cachedCoins);
        }

        console.log('Cache miss for coins by IDs - fetching from API');
        
        // Use request deduplication to prevent duplicate simultaneous requests
        const requestKey = generateRequestKey('coins-by-ids-fetch', { ids: ids.sort().join(',') });
        const coins = await requestDeduplicator.deduplicate(requestKey, () => fetchCoinsByIds(ids));
        
        // Cache for 90 seconds (increased from 60s for better performance)
        await cache.set(cacheKey, coins, { ttl: 90 });
        
        console.log('Search API - returning coins by IDs:', coins.length);
        return NextResponse.json(coins);
      }
    }
    
    // Sanitize search query
    const query = sanitizeSearchQuery(searchParams.get('q'));
    
    // Sanitize limit parameter
    const limit = sanitizeNumber(searchParams.get('limit') || '10', {
      min: 1,
      max: 100,
      integer: true,
      allowNegative: false,
    }) || 10;

    console.log('Search API - query:', query, 'limit:', limit);

    // Generate cache key
    const cacheKey = CacheManager.generateCacheKey('coins-search', { 
      query: query || 'top', 
      limit 
    });

    // Try cache first
    const cachedCoins = await cache.get(cacheKey);
    if (cachedCoins) {
      console.log('Cache hit for coins search');
      return NextResponse.json(cachedCoins);
    }

    console.log('Cache miss for coins search - fetching from API');
    
    // Use request deduplication to prevent duplicate simultaneous requests
    const requestKey = generateRequestKey('coins-search-fetch', { 
      query: query || 'top', 
      limit 
    });
    
    let coins;
    if (query) {
      coins = await requestDeduplicator.deduplicate(requestKey, () => searchCoins(query));
    } else {
      coins = await requestDeduplicator.deduplicate(requestKey, () => fetchTopCoins(limit));
    }

    // Cache search results for 3 minutes, top coins for 90 seconds (increased for better performance)
    const ttl = query ? 180 : 90;
    await cache.set(cacheKey, coins, { ttl });

    console.log('Search API - returning coins:', Array.isArray(coins) ? coins.length : 'not an array', coins);
    return NextResponse.json(coins);
  } catch (error: any) {
    console.error('Search API Error:', error);
    const statusCode = error.parsedError?.statusCode || error.response?.status || 500;
    const errorMessage = error.parsedError?.message || error.message || 'Failed to search coins';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        retryable: error.parsedError?.retryable || false,
      },
      { status: statusCode }
    );
  }
}
