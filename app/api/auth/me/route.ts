import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/guard'

// Returns the current session, or 401 if not authenticated.
export async function GET() {
  const guard = await requireSession()
  if (!guard.ok) return guard.response
  return NextResponse.json({ session: guard.session })
}
