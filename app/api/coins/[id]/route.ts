import { NextRequest, NextResponse } from 'next/server';
import { fetchCoinData, fetchPriceHistory } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const coinId = params.id;
    console.log('API Route - coinId:', coinId, typeof coinId);
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    const [coinData, priceHistory] = await Promise.all([
      fetchCoinData(coinId),
      fetchPriceHistory(coinId, days),
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

    return NextResponse.json(marketData);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coin data' },
      { status: 500 }
    );
  }
}
