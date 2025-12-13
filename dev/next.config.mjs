/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compression
  compress: true,

  // Performance optimizations
  experimental: {
    // Optimize package imports
    optimizePackageImports: [
      '@radix-ui/react-label',
      '@radix-ui/react-slot',
      'lucide-react',
    ],
  },

  // Headers for caching and security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      // Replace React with Preact in production (optional - can save ~30KB)
      // Uncomment if needed:
      // config.resolve.alias = {
      //   ...config.resolve.alias,
      //   'react': 'preact/compat',
      //   'react-dom': 'preact/compat',
      //   'react-dom/test-utils': 'preact/test-utils',
      // }

      // Tree shaking optimization
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      }
    }

    return config
  },

  // Output standalone for optimized Docker deployment
  output: 'standalone',

  // Ensure Next uses the project directory as the workspace root for tracing
  outputFileTracingRoot: process.cwd(),

  // Reduce build output
  typescript: {
    // Don't fail production build on TypeScript errors (we check separately)
    ignoreBuildErrors: false,
  },

  eslint: {
    // Linting is enforced via `npm run lint`; do not block builds
    ignoreDuringBuilds: true,
    // Run ESLint on these directories during production builds
    dirs: ['app', 'components', 'lib'],
  },
}

export default nextConfig
