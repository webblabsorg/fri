import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  eslint: {
    // Allow production builds to succeed even if there are ESLint warnings/errors.
    // Linting can still be enforced separately via `npm run lint`.
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
