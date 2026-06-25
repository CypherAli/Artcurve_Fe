import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED = ['/settings', '/studio', '/chat']

export function middleware(request: NextRequest) {
  const jwt = request.cookies.get('ac_jwt')?.value
  const isProtected = PROTECTED.some(p => request.nextUrl.pathname.startsWith(p))

  if (isProtected && !jwt) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('auth', 'required')
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/settings/:path*', '/studio/:path*', '/chat/:path*'],
}
