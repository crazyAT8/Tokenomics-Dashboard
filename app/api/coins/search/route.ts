import { NextRequest, NextResponse } from 'next/server';
import { searchCoins, fetchTopCoins, fetchCoinsByIds } from '@/lib/api';
import { sanitizeSearchQuery, sanitizeNumber, sanitizeCoinId } from '@/lib/utils/sanitize';
import { getCache } from '@/lib/cache/cache';
import { CacheManager } from '@/lib/cache/cache';

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
        const coins = await fetchCoinsByIds(ids);
        
        // Cache for 60 seconds (coin prices change frequently)
        await cache.set(cacheKey, coins, { ttl: 60 });
        
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
    let coins;
    if (query) {
      coins = await searchCoins(query);
    } else {
      coins = await fetchTopCoins(limit);
    }

    // Cache search results for 2 minutes, top coins for 60 seconds
    const ttl = query ? 120 : 60;
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
