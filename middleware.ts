import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, SESSION_COOKIE } from '@/lib/auth-edge'

// Public — keine Auth nötig
const PUBLIC_PATHS = ['/login', '/api/auth/login']

function isAdminPath(pathname: string) {
  return pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Immer erlaubt
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  // Session prüfen
  const token = request.cookies.get(SESSION_COOKIE)?.value
  const session = token ? await verifyToken(token) : null

  if (!session) {
    // API → 401, Seite → Login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Admin-Routen: nur für admin
  if (isAdminPath(pathname) && session.role !== 'admin') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico|css|js)$).*)'],
}
