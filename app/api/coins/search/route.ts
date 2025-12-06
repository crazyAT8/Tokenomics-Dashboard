import { NextRequest, NextResponse } from 'next/server';
import { searchCoins, fetchTopCoins } from '@/lib/api';
import { sanitizeSearchQuery, sanitizeNumber } from '@/lib/utils/sanitize';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
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

    let coins;
    if (query) {
      coins = await searchCoins(query);
    } else {
      coins = await fetchTopCoins(limit);
    }

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
