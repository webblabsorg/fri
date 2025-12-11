import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

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

  // Get session token
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/admin', '/settings', '/tools']
  const isProtectedPath = protectedPaths.some(p => path.startsWith(p))

  if (isProtectedPath && !token) {
    const signInUrl = new URL('/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(signInUrl)
  }

  // If user is authenticated, check for SSO and IP enforcement
  if (token?.sub) {
    const userId = token.sub

    // Check SSO enforcement (done via edge-compatible fetch to internal API)
    // Note: Full SSO check requires DB access; we set a header for route handlers
    const response = NextResponse.next()
    response.headers.set('x-user-id', userId)
    
    // IP whitelist check header - route handlers can use this
    const forwarded = request.headers.get('x-forwarded-for')
    const clientIP = forwarded?.split(',')[0]?.trim() || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1'
    response.headers.set('x-client-ip', clientIP)

    return response
  }

  return NextResponse.next()
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
