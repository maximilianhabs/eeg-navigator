import { NextRequest, NextResponse } from 'next/server'
import { findUserByUsername, comparePassword, signToken, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth'
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // IP aus Header (Caddy setzt x-forwarded-for) oder Fallback
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown'

  const { allowed, remaining, resetAt } = checkRateLimit(ip)
  if (!allowed) {
    const retryAfterSec = Math.ceil((resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { error: `Zu viele Anmeldeversuche. Bitte ${Math.ceil(retryAfterSec / 60)} Minuten warten.` },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSec),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  const { username, password } = await request.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'Benutzername und Passwort erforderlich' }, { status: 400 })
  }

  const user = findUserByUsername(username)
  if (!user) {
    // Timing attack prevention: always compare
    await comparePassword(password, '$2b$12$invalidhashplaceholderXXXXXXXXXXXXXXXXXXXXXX')
    return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 })
  }

  const valid = await comparePassword(password, user.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 })
  }

  // Erfolgreicher Login: Rate-Limit-Zähler zurücksetzen
  resetRateLimit(ip)

  const token = signToken({
    userId: user.id,
    username: user.username,
    role: user.role,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  })

  const response = NextResponse.json({ ok: true, role: user.role })
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
  return response
}
