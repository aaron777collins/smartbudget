/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Bundle optimization - tree-shake heavy libraries
  experimental: {
    optimizePackageImports: [
      'd3',
      'd3-sankey',
      'recharts',
      'jspdf',
      'jspdf-autotable',
      'papaparse',
      '@xenova/transformers',
    ],
  },

  // Cache headers for API routes
  async headers() {
    return [
      {
        // Dashboard and analytics endpoints - 5 minute cache
        source: '/api/dashboard/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
          },
        ],
      },
      {
        // Insights endpoints - 15 minute cache (less frequently changing)
        source: '/api/insights/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=900, s-maxage=900, stale-while-revalidate=1800',
          },
        ],
      },
      {
        // Categories and static data - 1 hour cache
        source: '/api/categories/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=7200',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
