import mongoose from 'mongoose'

// Cached Mongoose connection for dev hot-reload.
// In development, a new connection on every hot reload can exhaust the
// connection pool, so we cache the connection (and its promise) on globalThis.

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error(
    'Missing MONGODB_URI: set it in .env (see .env.example) before running the app.',
  )
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// Augment globalThis with the cache slot (dev-only safe pattern).
const globalWithMongoose = globalThis as typeof globalThis & {
  _mongoose?: MongooseCache
}

const cached: MongooseCache = globalWithMongoose._mongoose ?? {
  conn: null,
  promise: null,
}

globalWithMongoose._mongoose = cached

export async function connectDB(): Promise<typeof mongoose> {
  // Re-read inside the function so TypeScript narrows the type (the
  // module-level guard above protects at import time, but TS cannot carry
  // that narrowing across the closure boundary).
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error(
      'Missing MONGODB_URI: set it in .env (see .env.example) before running the app.',
    )
  }

  // Reuse an existing live connection.
  if (cached.conn) {
    return cached.conn
  }

  // Start (or reuse) the connection promise; buffer commands until connected.
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      maxPoolSize: 10,
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (err) {
    // Reset the cached promise so the next call retries cleanly.
    cached.promise = null
    throw err
  }

  return cached.conn
}
