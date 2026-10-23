// Server-side guard for API route handlers.
// Every protected route re-checks the session here — middleware only guards
// pages, so this is the authoritative check.

import { NextResponse } from 'next/server'
import { getSession, clearSession } from '@/lib/session'
import { User } from '@/models/user'
import { connectDB } from '@/lib/db'
import type { Session } from '@/lib/auth'

export type GuardResult =
  | { ok: true; session: Session }
  | { ok: false; response: NextResponse }

// Returns 401 if there is no valid session.
export async function requireSession(): Promise<GuardResult> {
  const session = await getSession()
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    }
  }
  return { ok: true, session }
}

// Returns 401 if unauthenticated, 403 if the role isn't allowed.
// Also re-reads the user from the DB so a deactivated user loses access
// immediately, even with a still-valid token.
export async function requireRole(
  ...roles: Session['role'][]
): Promise<GuardResult> {
  const guard = await requireSession()
  if (!guard.ok) return guard
  const { session } = guard

  await connectDB()
  const user = await User.findOne({
    _id: session.userId,
    organizationId: session.organizationId,
  }).lean()

  if (!user || !user.isActive) {
    await clearSession()
    return {
      ok: false,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    }
  }

  if (!roles.includes(session.role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return { ok: true, session }
}
