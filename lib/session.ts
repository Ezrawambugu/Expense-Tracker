// Reads/writes the session cookie.
// Cookie flags: HTTP-only, SameSite=Lax, Secure in production.

import { cookies } from 'next/headers'
import { signSession, verifySession, type Session } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/user'

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
// Role and department are refreshed from the database so admin changes
// (Phase 5: assign roles and departments) take effect before the 8-hour token
// expires — the API guard in lib/guard.ts checks this same session.
// isActive is deliberately NOT checked here: this runs during render, where
// cookies cannot be cleared, so a null session would bounce a deactivated
// user between middleware's /login redirect and the pages' own guard. API
// routes enforce isActive authoritatively in lib/guard.ts.
export async function getSession(): Promise<Session | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  const session = await verifySession(token)
  if (!session) return null

  await connectDB()
  const user = await User.findOne({
    _id: session.userId,
    organizationId: session.organizationId,
  })
    .select('role departmentId')
    .lean<{ role: Session['role']; departmentId?: unknown } | null>()

  // Deleted user: keep the token session (the guard's isActive/404 paths
  // handle mutations); every page still scopes queries by organizationId.
  if (!user) return session

  return {
    ...session,
    role: user.role,
    departmentId: user.departmentId ? String(user.departmentId) : null,
  }
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
