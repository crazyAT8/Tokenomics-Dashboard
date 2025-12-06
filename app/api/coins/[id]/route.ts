import { NextRequest, NextResponse } from 'next/server';
import { fetchCoinData, fetchPriceHistory } from '@/lib/api';
import { validateMarketData } from '@/lib/validation/validators';
import { sanitizeCoinId, sanitizeCurrency, sanitizeNumber, sanitizeDate } from '@/lib/utils/sanitize';

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
    
    // Check for custom date range
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    
    let priceHistoryOptions: { days?: number; from?: Date; to?: Date; currency?: string } = {
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
    }

    const [coinData, priceHistory] = await Promise.all([
      fetchCoinData(coinId, currency),
      fetchPriceHistory(coinId, priceHistoryOptions),
    ]);

    const marketData = {
      coin: coinData,
      priceHistory,
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
