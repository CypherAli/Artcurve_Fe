import { NextRequest, NextResponse } from 'next/server'

// Routes that require authentication
const PROTECTED_ROUTES = ['/vault', '/studio']

// Routes only for unauthenticated users
const AUTH_ROUTES: string[] = []

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the route needs auth
  const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  if (!isProtected) return NextResponse.next()

  // Read JWT from cookie (set by auth-store on login)
  // We check a cookie named 'artcurve_jwt' — auth-store must set this on login
  const jwtCookie = request.cookies.get('artcurve_jwt')?.value
  // Also accept Authorization header for API routes
  const authHeader = request.headers.get('authorization')

  const hasAuth = !!(jwtCookie || authHeader)

  if (!hasAuth) {
    // Redirect to home with a `redirect` param so after login we go back
    const loginUrl = new URL('/', request.url)
    loginUrl.searchParams.set('requireAuth', '1')
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match protected routes, skip static files and API routes
    '/((?!_next/static|_next/image|favicon.ico|images|convergence|api).*)',
  ],
}
