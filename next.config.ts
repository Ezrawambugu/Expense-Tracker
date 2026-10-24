import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Dev-only: allow opening the dev server on these hosts. Without this, Next
  // blocks its dev resources (HMR client) when the origin isn't `localhost`.
  allowedDevOrigins: ['127.0.0.1', '192.168.100.14'],
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
}

export default nextConfig
