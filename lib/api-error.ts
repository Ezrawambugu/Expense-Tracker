// Service-layer HTTP errors plus the consistent `{ error, details? }` envelope
// used by every API route.

import { NextResponse } from 'next/server'

export type HttpError = Error & { status: number }

export function httpError(status: number, message: string): HttpError {
  return Object.assign(new Error(message), { status })
}

// Maps an unknown thrown value to a JSON response. Known `httpError`s keep
// their status and message; anything else becomes a generic 500 so internal
// details (and never secrets) don't leak to the client.
export function errorResponse(err: unknown): NextResponse {
  const status = (err as { status?: number }).status
  if (status && status >= 400 && status < 600) {
    return NextResponse.json({ error: (err as Error).message }, { status })
  }

  console.error('Unhandled API error:', err)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
