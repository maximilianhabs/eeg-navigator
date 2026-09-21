import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'

// Re-export edge-compatible types and constants so importers don't need two imports
export type { UserRole, SessionPayload } from './auth-edge'
export { SESSION_COOKIE } from './auth-edge'

// ─── Types (Node.js runtime only) ─────────────────────────────────────────────

import type { UserRole, SessionPayload } from './auth-edge'

export interface User {
  id: string
  username: string
  passwordHash: string
  role: UserRole
  createdAt: string
}

// ─── Token signing (HMAC-SHA256, no external dep) ────────────────────────────

function secret() {
  const s = process.env.APP_SECRET
  if (!s || s === 'ERSETZE_MICH_MIT_ZUFALLSSTRING') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('APP_SECRET ist nicht gesetzt. Produktionsstart abgebrochen.')
    }
    return 'dev-secret-please-change-in-production'
  }
  return s
}

export function signToken(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', secret()).update(data).digest('base64url')
  return `${data}.${sig}`
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const [data, sig] = token.split('.')
    if (!data || !sig) return null
    const expected = crypto.createHmac('sha256', secret()).update(data).digest('base64url')
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as SessionPayload
    if (Date.now() > payload.exp) return null
    return payload
  } catch {
    return null
  }
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

export const SESSION_MAX_AGE = 60 * 60 * 10 // 10 hours

// ─── User storage (data/users.json) ──────────────────────────────────────────

const USERS_PATH = path.join(process.cwd(), 'data', 'users.json')

export function getUsers(): User[] {
  try {
    const raw = fs.readFileSync(USERS_PATH, 'utf-8')
    return (JSON.parse(raw) as { users: User[] }).users
  } catch {
    return []
  }
}

export function saveUsers(users: User[]): void {
  fs.writeFileSync(USERS_PATH, JSON.stringify({ users }, null, 2), 'utf-8')
}

export function findUserByUsername(username: string): User | null {
  return getUsers().find(u => u.username === username) ?? null
}

export function findUserById(id: string): User | null {
  return getUsers().find(u => u.id === id) ?? null
}

// ─── Password ─────────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
