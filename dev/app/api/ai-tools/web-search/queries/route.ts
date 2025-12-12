import { NextRequest } from 'next/server'
import { GET as webSearchGet } from '@/app/api/web-search/route'

// Alias: GET /api/ai-tools/web-search/queries -> GET /api/web-search
export async function GET(request: NextRequest) {
  return webSearchGet(request)
}
