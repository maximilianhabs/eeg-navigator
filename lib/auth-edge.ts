// Edge Runtime-compatible auth — Web Crypto API only, no Node.js modules
// Used by middleware.ts. Server components use lib/auth.ts (Node.js runtime).

export type UserRole = 'user' | 'admin'
export interface SessionPayload { userId: string; username: string; role: UserRole; exp: number }
export const SESSION_COOKIE = 'eeg-session'

function getSecret() {
  const s = process.env.APP_SECRET
  if (!s || s === 'ERSETZE_MICH_MIT_ZUFALLSSTRING') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('APP_SECRET ist nicht gesetzt. Produktionsstart abgebrochen.')
    }
    return 'dev-secret-please-change-in-production'
  }
  return s
}

function toBase64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function fromBase64url(str: string): string {
  return atob(str.replace(/-/g, '+').replace(/_/g, '/'))
}

async function hmacSign(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return toBase64url(sig)
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const dot = token.lastIndexOf('.')
    if (dot === -1) return null
    const data = token.slice(0, dot)
    const sig = token.slice(dot + 1)
    const expected = await hmacSign(data)
    // constant-time compare
    if (sig.length !== expected.length) return null
    let diff = 0
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i)
    if (diff !== 0) return null
    const payload = JSON.parse(fromBase64url(data)) as SessionPayload
    if (Date.now() > payload.exp) return null
    return payload
  } catch {
    return null
  }
}
