// In-memory rate limiter für Login-Endpunkt
// Kein Redis nötig — bei Single-Container-Deployment ausreichend
// Limit: 5 Versuche pro IP innerhalb von 15 Minuten

interface Bucket {
  count: number
  resetAt: number
}

const WINDOW_MS = 15 * 60 * 1000  // 15 Minuten
const MAX_ATTEMPTS = 5

const store = new Map<string, Bucket>()

// Aufräumen alle 10 Minuten — verhindert unbegrenztes Wachstum
setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of store) {
    if (bucket.resetAt < now) store.delete(key)
  }
}, 10 * 60 * 1000)

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const bucket = store.get(ip)

  if (!bucket || bucket.resetAt < now) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, resetAt: now + WINDOW_MS }
  }

  if (bucket.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt }
  }

  bucket.count++
  return { allowed: true, remaining: MAX_ATTEMPTS - bucket.count, resetAt: bucket.resetAt }
}

export function resetRateLimit(ip: string): void {
  store.delete(ip)
}
