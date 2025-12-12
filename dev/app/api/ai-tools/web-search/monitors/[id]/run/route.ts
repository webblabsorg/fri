import { NextRequest } from 'next/server'
import { POST as runPost } from '@/app/api/web-search/monitors/[id]/run/route'

// Alias: /api/ai-tools/web-search/monitors/:id/run -> /api/web-search/monitors/:id/run
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return runPost(request, { params: context.params })
}
