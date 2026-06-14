import { NextRequest, NextResponse } from 'next/server'
import { findUserByUsername, comparePassword, signToken, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth'

export async function POST(request: NextRequest) {
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
