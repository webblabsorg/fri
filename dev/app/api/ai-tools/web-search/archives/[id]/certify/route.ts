import { NextRequest } from 'next/server'
import { POST as certifyPost } from '@/app/api/web-search/archives/[id]/certify/route'

// Alias: /api/ai-tools/web-search/archives/:id/certify -> /api/web-search/archives/:id/certify
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return certifyPost(request, { params: context.params })
}
