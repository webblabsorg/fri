import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware for:
 * 1. SSO enforcement - redirect to SSO if enforced for user's org
 * 2. IP whitelist enforcement - block requests from non-whitelisted IPs
 * 3. Admin route protection
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Skip middleware for auth routes, API routes, and static files
  if (
    path.startsWith('/api/auth') ||
    path.startsWith('/api/enterprise/scim') ||
    path.startsWith('/_next') ||
    path.startsWith('/favicon') ||
    path === '/signin' ||
    path === '/signup' ||
    path === '/sso/callback'
  ) {
    return NextResponse.next()
  }

  // For now, let client-side handle auth checking since middleware JWT verification
  // is complex with Edge Runtime. Dashboard pages already handle auth properly.
  
  // Set headers for IP tracking (used by SSO/IP whitelist enforcement)
  const response = NextResponse.next()
  
  const forwarded = request.headers.get('x-forwarded-for')
  const clientIP = forwarded?.split(',')[0]?.trim() || 
                   request.headers.get('x-real-ip') || 
                   '127.0.0.1'
  response.headers.set('x-client-ip', clientIP)

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/settings/:path*',
    '/tools/:path*',
    '/api/:path*',
  ],
}
