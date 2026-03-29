import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const PROTECTED_PREFIXES = ['/user-dashboard', '/admin-dashboard']
// Routes only for admins
const ADMIN_PREFIXES = ['/admin-dashboard']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  // Read token from cookie (we'll also save it there on login)
  const token = request.cookies.get('token')?.value

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin-only route check
  const role = request.cookies.get('role')?.value
  const isAdminRoute = ADMIN_PREFIXES.some((p) => pathname.startsWith(p))
  if (isAdminRoute && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/user-dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/user-dashboard/:path*', '/admin-dashboard/:path*'],
}
