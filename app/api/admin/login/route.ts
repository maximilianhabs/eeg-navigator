import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { password } = await request.json()
  const secret = process.env.ADMIN_SECRET

  if (!secret) {
    return NextResponse.json({ error: 'Admin nicht konfiguriert' }, { status: 500 })
  }
  if (password !== secret) {
    return NextResponse.json({ error: 'Ungültiges Passwort' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('eeg-admin-session', secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 8,
    path: '/',
  })
  return response
}
