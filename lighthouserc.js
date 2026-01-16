module.exports = {
  ci: {
    collect: {
      // Test URLs - adjust based on deployed URL or use localhost
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/transactions',
        'http://localhost:3000/budgets',
        'http://localhost:3000/accounts',
      ],
      // Number of runs per URL for consistency
      numberOfRuns: 3,
      // Collect source maps for better debugging
      settings: {
        // Emulate a typical mid-range mobile device
        emulatedFormFactor: 'mobile',
        // Lighthouse 10+ config
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
        // Skip certain audits that may not be relevant
        skipAudits: [
          'uses-http2', // May not be available in all environments
        ],
        // Collect performance, accessibility, best practices, SEO
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },
    assert: {
      // Performance thresholds (target >90 per requirements)
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.8 }],

        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 1500 }], // Target <1.5s
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }], // Target <2.5s
        'total-blocking-time': ['warn', { maxNumericValue: 300 }], // Target <300ms
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // Target <0.1
        'speed-index': ['warn', { maxNumericValue: 3000 }], // Target <3s
        'interactive': ['warn', { maxNumericValue: 3000 }], // Target <3s (TTI)

        // Performance budgets
        'resource-summary:script:size': ['warn', { maxNumericValue: 512000 }], // 500KB JS
        'resource-summary:stylesheet:size': ['warn', { maxNumericValue: 102400 }], // 100KB CSS
        'resource-summary:image:size': ['warn', { maxNumericValue: 512000 }], // 500KB images
        'resource-summary:total:size': ['warn', { maxNumericValue: 2048000 }], // 2MB total

        // Accessibility
        'color-contrast': 'error',
        'duplicate-id-aria': 'error',
        'aria-allowed-attr': 'error',
        'aria-required-attr': 'error',
        'aria-valid-attr': 'error',
        'button-name': 'error',
        'link-name': 'error',
        'image-alt': 'error',
        'label': 'error',

        // Best practices
        'errors-in-console': 'warn',
        'no-vulnerable-libraries': 'warn',
        'uses-https': 'error',
        'geolocation-on-start': 'error',
        'notification-on-start': 'error',
      },
    },
    upload: {
      // Store results locally
      target: 'filesystem',
      outputDir: './lighthouse-results',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%',
    },
  },
};
