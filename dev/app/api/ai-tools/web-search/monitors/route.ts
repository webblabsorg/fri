import { NextRequest } from 'next/server'
import { POST as monitorsPost, GET as monitorsGet } from '@/app/api/web-search/monitors/route'

// Alias: /api/ai-tools/web-search/monitors -> /api/web-search/monitors
export async function POST(request: NextRequest) {
  return monitorsPost(request)
}

export async function GET(request: NextRequest) {
  return monitorsGet(request)
}
