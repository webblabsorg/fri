import { NextRequest } from 'next/server'
import { POST as citePost } from '@/app/api/web-search/results/[id]/cite/route'

// Alias: /api/ai-tools/web-search/results/:id/cite -> /api/web-search/results/:id/cite
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return citePost(request, { params: context.params })
}
