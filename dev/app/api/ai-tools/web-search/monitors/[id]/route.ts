import { NextRequest } from 'next/server'
import { GET as monitorGet, PATCH as monitorPatch, DELETE as monitorDelete } from '@/app/api/web-search/monitors/[id]/route'

// Alias: /api/ai-tools/web-search/monitors/:id -> /api/web-search/monitors/:id
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return monitorGet(request, { params: context.params })
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return monitorPatch(request, { params: context.params })
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return monitorDelete(request, { params: context.params })
}
