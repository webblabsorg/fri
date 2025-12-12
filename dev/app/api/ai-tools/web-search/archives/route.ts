import { NextRequest } from 'next/server'
import { GET as archivesGet } from '@/app/api/web-search/archives/route'

// Alias: /api/ai-tools/web-search/archives -> /api/web-search/archives
export async function GET(request: NextRequest) {
  return archivesGet(request)
}
