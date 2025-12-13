import { NextRequest, NextResponse } from 'next/server';
import { fetchCoinData, fetchPriceHistory, fetchOHLC } from '@/lib/api';
import { validateMarketData } from '@/lib/validation/validators';
import { sanitizeCoinId, sanitizeCurrency, sanitizeNumber, sanitizeDate } from '@/lib/utils/sanitize';
import { getCache } from '@/lib/cache/cache';
import { CacheManager } from '@/lib/cache/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Sanitize coin ID from URL parameter
    const coinId = sanitizeCoinId(params.id);
    if (!coinId) {
      return NextResponse.json(
        { error: 'Invalid coin ID' },
        { status: 400 }
      );
    }
    
    console.log('API Route - coinId:', coinId, typeof coinId);
    const { searchParams } = new URL(request.url);
    
    // Sanitize currency parameter
    const currency = sanitizeCurrency(searchParams.get('currency'));
    
    // Check for chart type (optional)
    const chartType = searchParams.get('chartType') === 'candlestick' ? 'candlestick' : 'line';
    
    // Check for custom date range
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    
    let priceHistoryOptions: { days?: number; from?: Date; to?: Date; currency?: string } = {
      currency,
    };
    
    let ohlcOptions: { days?: number; currency?: string } = {
      currency,
    };
    
    if (fromParam && toParam) {
      // Sanitize and validate custom date range
      const from = sanitizeDate(fromParam, { maxDate: new Date() });
      const to = sanitizeDate(toParam, { maxDate: new Date() });
      
      if (!from || !to || from >= to) {
        return NextResponse.json(
          { error: 'Invalid date range' },
          { status: 400 }
        );
      }
      
      priceHistoryOptions.from = from;
      priceHistoryOptions.to = to;
      // Calculate days for OHLC (CoinGecko OHLC doesn't support custom date ranges)
      const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
      ohlcOptions.days = Math.min(365, Math.max(1, daysDiff));
    } else {
      // Sanitize days parameter
      const days = sanitizeNumber(searchParams.get('days') || '7', {
        min: 1,
        max: 365,
        integer: true,
        allowNegative: false,
      });
      
      if (days === null) {
        return NextResponse.json(
          { error: 'Invalid days parameter' },
          { status: 400 }
        );
      }
      
      priceHistoryOptions.days = days;
      ohlcOptions.days = days;
    }

    // Generate cache key
    const cacheKey = CacheManager.generateCacheKey('coin-data', {
      coinId,
      currency,
      chartType,
      days: priceHistoryOptions.days,
      from: fromParam,
      to: toParam,
    });

    // Try to get from cache
    const cache = getCache();
    const cachedData = await cache.get(cacheKey);

    if (cachedData) {
      console.log('Cache hit for coin data:', coinId);
      return NextResponse.json(cachedData);
    }

    console.log('Cache miss for coin data:', coinId, '- fetching from API');

    // Fetch data based on chart type
    const [coinData, priceHistory, ohlcData] = await Promise.all([
      fetchCoinData(coinId, currency),
      fetchPriceHistory(coinId, priceHistoryOptions),
      chartType === 'candlestick' ? fetchOHLC(coinId, ohlcOptions) : Promise.resolve(undefined),
    ]);

    const marketData = {
      coin: coinData,
      priceHistory,
      ohlcData,
      tokenomics: {
        circulating_supply: coinData.circulating_supply,
        total_supply: coinData.total_supply,
        max_supply: coinData.max_supply,
        market_cap: coinData.market_cap,
        fully_diluted_valuation: coinData.fully_diluted_valuation,
        price: coinData.current_price,
        price_change_24h: coinData.price_change_24h,
        price_change_percentage_24h: coinData.price_change_percentage_24h,
        volume_24h: coinData.total_volume,
        market_cap_rank: coinData.market_cap_rank,
      },
    };

    // Validate the final market data before sending
    const validatedMarketData = validateMarketData(marketData);

    // Cache the result with TTL based on data freshness needs
    // Coin data changes frequently, so use shorter TTL (30 seconds)
    // Historical data can be cached longer (5 minutes)
    const ttl = fromParam && toParam ? 300 : 30; // 5 min for historical, 30s for current
    await cache.set(cacheKey, validatedMarketData, { ttl });

    return NextResponse.json(validatedMarketData);
  } catch (error: any) {
    console.error('API Error:', error);
    const statusCode = error.parsedError?.statusCode || error.response?.status || 500;
    const errorMessage = error.parsedError?.message || error.message || 'Failed to fetch coin data';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        retryable: error.parsedError?.retryable || false,
      },
      { status: statusCode }
    );
  }
}
