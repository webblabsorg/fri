import { NextRequest } from 'next/server'
import { POST as webSearchPost, GET as webSearchGet } from '@/app/api/web-search/route'

// Alias routes for /api/ai-tools/web-search/* -> /api/web-search/*
// This maintains spec compliance while reusing existing handlers

export async function POST(request: NextRequest) {
  return webSearchPost(request)
}

export async function GET(request: NextRequest) {
  return webSearchGet(request)
}
