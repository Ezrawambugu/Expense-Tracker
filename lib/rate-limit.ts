// Simple fixed-window, in-memory rate limiter (per instance).
// Good enough for "simple rate limiting on login" (Phase 1). If the app is
// scaled to multiple instances, replace with a shared store (e.g. Redis).

type Entry = { count: number; resetAt: number }
const buckets = new Map<string, Entry>()

const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_ATTEMPTS = 5

export function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = buckets.get(key)

  if (!entry || now >= entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (entry.count >= MAX_ATTEMPTS) return false
  entry.count += 1
  return true
}

// Clear the bucket after a successful login so legitimate users aren't locked
// out by their own earlier typos.
export function resetRateLimit(key: string): void {
  buckets.delete(key)
}
