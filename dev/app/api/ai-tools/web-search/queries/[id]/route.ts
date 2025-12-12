import { NextRequest } from 'next/server'
import { GET as queryGet, DELETE as queryDelete } from '@/app/api/web-search/queries/[id]/route'

// Alias: /api/ai-tools/web-search/queries/:id -> /api/web-search/queries/:id
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return queryGet(request, { params: context.params })
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return queryDelete(request, { params: context.params })
}
