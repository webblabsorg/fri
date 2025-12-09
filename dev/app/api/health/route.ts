import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    phase: 'Phase 0 - Foundation & Setup',
    version: '0.1.0',
  })
}
