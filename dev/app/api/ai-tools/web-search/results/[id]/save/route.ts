import { NextRequest } from 'next/server'
import { POST as savePost } from '@/app/api/web-search/results/[id]/save/route'

// Alias: /api/ai-tools/web-search/results/:id/save -> /api/web-search/results/:id/save
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return savePost(request, { params: context.params })
}
