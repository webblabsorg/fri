import { NextRequest } from 'next/server'
import { GET as resultGet, PATCH as resultPatch } from '@/app/api/web-search/results/[id]/route'

// Alias: /api/ai-tools/web-search/results/:id -> /api/web-search/results/:id
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return resultGet(request, { params: context.params })
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return resultPatch(request, { params: context.params })
}
