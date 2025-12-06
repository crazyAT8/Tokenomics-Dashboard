import { NextRequest, NextResponse } from 'next/server';
import { fetchExchangeRates } from '@/lib/api';
import { validateExchangeRates } from '@/lib/validation/validators';
import { sanitizeCurrency } from '@/lib/utils/sanitize';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Sanitize base currency parameter
    const baseCurrency = sanitizeCurrency(searchParams.get('base'));
    
    const exchangeRates = await fetchExchangeRates(baseCurrency);
    
    // Validate the exchange rates before sending (extra safety layer)
    const validatedExchangeRates = validateExchangeRates(exchangeRates);
    
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

