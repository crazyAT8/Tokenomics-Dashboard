import { NextRequest, NextResponse } from 'next/server';
import { fetchExchangeRates } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const baseCurrency = searchParams.get('base') || 'usd';
    
    const exchangeRates = await fetchExchangeRates(baseCurrency);
    
    return NextResponse.json(exchangeRates);
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

