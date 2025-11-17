import { NextResponse } from 'next/server';

/**
 * Health check endpoint for network status detection
 */
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}

