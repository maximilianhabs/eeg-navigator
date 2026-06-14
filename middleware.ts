import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_ADMIN_PATHS = ['/admin', '/api/admin/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
  if (!isAdminPath) return NextResponse.next()
  if (PUBLIC_ADMIN_PATHS.includes(pathname)) return NextResponse.next()

  const session = request.cookies.get('eeg-admin-session')
  const secret = process.env.ADMIN_SECRET

  if (!secret || session?.value !== secret) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
