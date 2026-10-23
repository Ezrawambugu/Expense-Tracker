// JWT session tokens, signed with jose (HS256).
// The token is stored in an HTTP-only cookie (see lib/session.ts).

import { SignJWT, jwtVerify } from 'jose'

const SESSION_SECONDS = 60 * 60 * 8 // 8 hour expiry

export type Session = {
  userId: string
  organizationId: string
  departmentId: string | null
  role: 'admin' | 'manager' | 'staff'
}

function secretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('Missing JWT_SECRET environment variable')
  }
  return new TextEncoder().encode(secret)
}

export async function signSession(session: Session): Promise<string> {
  return new SignJWT({
    organizationId: session.organizationId,
    departmentId: session.departmentId,
    role: session.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(secretKey())
}

// Returns the session, or null if the token is invalid/expired.
export async function verifySession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ['HS256'],
    })
    if (!payload.sub) return null
    const role = payload.role
    if (role !== 'admin' && role !== 'manager' && role !== 'staff') return null
    return {
      userId: payload.sub,
      organizationId: String(payload.organizationId),
      departmentId: payload.departmentId
        ? String(payload.departmentId)
        : null,
      role,
    }
  } catch {
    return null
  }
}
