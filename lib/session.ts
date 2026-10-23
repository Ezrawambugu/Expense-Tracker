// Reads/writes the session cookie.
// Cookie flags: HTTP-only, SameSite=Lax, Secure in production.

import { cookies } from 'next/headers'
import { signSession, verifySession, type Session } from '@/lib/auth'

export const SESSION_COOKIE = 'session'

function cookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    ...(maxAge !== undefined ? { maxAge } : {}),
  }
}

// Reads and verifies the session from the request cookie (null if none/invalid).
export async function getSession(): Promise<Session | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySession(token)
}

// Must be called from a route handler or server action (writes are not allowed
// during render of a server component).
export async function setSession(session: Session): Promise<void> {
  const token = await signSession(session)
  const store = await cookies()
  store.set(SESSION_COOKIE, token, cookieOptions(60 * 60 * 8))
}

export async function clearSession(): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, '', cookieOptions(0))
}
