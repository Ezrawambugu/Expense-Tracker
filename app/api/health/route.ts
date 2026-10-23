import { NextResponse } from 'next/server'
import { connection } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/db'

// Health check: always compute per request, never cache.
// With `cacheComponents`, we opt into dynamic rendering via `connection()`
// instead of the legacy `export const dynamic = 'force-dynamic'` segment config.
export async function GET() {
  // Suspense/request boundary: ensures this handler runs at request time.
  await connection()

  try {
    await connectDB()

    return NextResponse.json({
      status: 'ok',
      db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      {
        status: 'error',
        error: 'Database connection failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}
