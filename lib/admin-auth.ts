import { cookies } from 'next/headers'
import { verifyToken, SESSION_COOKIE, type SessionPayload } from './auth'

async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return session?.role === 'admin'
}

export async function getCurrentUser(): Promise<SessionPayload | null> {
  return getSession()
}
