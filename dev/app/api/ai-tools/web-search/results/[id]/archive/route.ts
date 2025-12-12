import { NextRequest } from 'next/server'
import { POST as archivePost } from '@/app/api/web-search/results/[id]/archive/route'

// Alias: /api/ai-tools/web-search/results/:id/archive -> /api/web-search/results/:id/archive
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return archivePost(request, { params: context.params })
}
