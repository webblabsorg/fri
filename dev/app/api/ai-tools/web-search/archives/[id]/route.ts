import { NextRequest } from 'next/server'
import { GET as archiveGet } from '@/app/api/web-search/archives/[id]/route'

// Alias: /api/ai-tools/web-search/archives/:id -> /api/web-search/archives/:id
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return archiveGet(request, { params: context.params })
}
