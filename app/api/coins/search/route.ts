import { NextRequest, NextResponse } from 'next/server';
import { searchCoins, fetchTopCoins } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');

    let coins;
    if (query) {
      coins = await searchCoins(query);
    } else {
      coins = await fetchTopCoins(limit);
    }

    return NextResponse.json(coins);
  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json(
      { error: 'Failed to search coins' },
      { status: 500 }
    );
  }
}
