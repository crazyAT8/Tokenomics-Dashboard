import { NextRequest, NextResponse } from 'next/server';
import { fetchCoinData, fetchPriceHistory } from '@/lib/api';
import { validateMarketData } from '@/lib/validation/validators';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const coinId = params.id;
    console.log('API Route - coinId:', coinId, typeof coinId);
    const { searchParams } = new URL(request.url);
    
    // Get currency parameter, default to 'usd'
    const currency = searchParams.get('currency') || 'usd';
    
    // Check for custom date range
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    
    let priceHistoryOptions: { days?: number; from?: Date; to?: Date; currency?: string } = {
      currency,
    };
    
    if (fromParam && toParam) {
      // Custom date range
      priceHistoryOptions.from = new Date(fromParam);
      priceHistoryOptions.to = new Date(toParam);
    } else {
      // Use days parameter
      const days = parseInt(searchParams.get('days') || '7');
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
