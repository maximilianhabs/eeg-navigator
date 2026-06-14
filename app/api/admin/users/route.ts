import { NextRequest, NextResponse } from 'next/server'
import { getUsers, saveUsers, hashPassword, type UserRole } from '@/lib/auth'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import crypto from 'crypto'

export async function GET() {
  const users = getUsers().map(({ passwordHash: _, ...u }) => u)
  return NextResponse.json({ users })
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  const { username, password, role } = await request.json()
  if (!username || !password || !['user', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })
  }

  const users = getUsers()
  if (users.find(u => u.username === username)) {
    return NextResponse.json({ error: 'Benutzername bereits vergeben' }, { status: 409 })
  }

  const newUser = {
    id: `usr_${crypto.randomBytes(4).toString('hex')}`,
    username,
    passwordHash: await hashPassword(password),
    role: role as UserRole,
    createdAt: new Date().toISOString().split('T')[0],
  }

  saveUsers([...users, newUser])
  const { passwordHash: _, ...safe } = newUser
  return NextResponse.json({ ok: true, user: safe })
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  const { id } = await request.json()
  const users = getUsers()
  const target = users.find(u => u.id === id)
  if (!target) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  // Can't delete last admin
  const admins = users.filter(u => u.role === 'admin')
  if (target.role === 'admin' && admins.length <= 1) {
    return NextResponse.json({ error: 'Letzten Admin kann man nicht löschen' }, { status: 400 })
  }

  saveUsers(users.filter(u => u.id !== id))
  return NextResponse.json({ ok: true })
}
