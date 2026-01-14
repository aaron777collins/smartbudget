const { withSentryConfig } = require('@sentry/nextjs');

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

  // Security and cache headers
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.anthropic.com https://*.sentry.io https://vercel.live wss://ws.pusher.com",
              "frame-src 'self' https://vercel.live",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
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

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: true,

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token is read from SENTRY_AUTH_TOKEN environment variable
};

// Export with Sentry wrapper if DSN is configured, otherwise export plain config
module.exports = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
