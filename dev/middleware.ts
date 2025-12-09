import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Admin route protection will be handled by the route itself
  // This middleware can be extended for additional checks
  
  const path = request.nextUrl.pathname

  // Add admin route markers
  if (path.startsWith('/admin')) {
    // Let the route handler check admin role
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    // Add other protected routes here
  ],
}
