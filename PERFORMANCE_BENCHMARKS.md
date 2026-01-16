# Performance Benchmarks - SmartBudget

## Status: BLOCKED

**Last Updated:** 2026-01-16

## Critical Blocker Identified

### Issue: Missing Critical Dependencies

During attempts to run Lighthouse performance benchmarks, a critical dependency installation issue was discovered that prevents the application from running.

**Symptoms:**
- Application fails to start in both dev and production modes
- Returns HTTP 500 errors when accessed
- Build process fails with module resolution errors

**Root Cause:**
The following critical dependencies are listed in `package.json` devDependencies but are **not being installed** by npm:
- `tailwindcss@^3.4.19`
- `tailwindcss-animate@^1.0.7`
- `autoprefixer@^10.4.23`
- `postcss@^8.5.6`

**Error Messages:**
```
Error: Cannot find module 'tailwindcss'
Module not found: Can't resolve 'tailwindcss-animate'
```

**Troubleshooting Attempted:**
1. ✗ `npm install` - Reports "up to date" but packages not installed
2. ✗ `npm ci` - Clean install does not install packages
3. ✗ `rm -rf node_modules && npm install` - Full reinstall does not work
4. ✗ `npm install tailwindcss@3.4.19 --save-dev` - Explicit install does not work
5. ✗ `npm install --legacy-peer-deps tailwindcss` - Does not resolve issue
6. Verified packages ARE listed in `package-lock.json` correctly
7. Verified packages ARE listed in `package.json` devDependencies
8. Verified npm is not in production mode (`npm config get production` = null)
9. Verified no conflicting package manager lockfiles

**Verification:**
```bash
# Packages listed in package.json devDependencies
$ cat package.json | jq '.devDependencies | keys' | grep tailwind
  "tailwindcss",
  "tailwindcss-animate",

# Packages listed in package-lock.json
$ jq '.packages."node_modules/tailwindcss"' package-lock.json | head -5
{
  "version": "3.4.19",
  "resolved": "https://registry.npmjs.org/tailwindcss/-/tailwindcss-3.4.19.tgz",
  "integrity": "sha512-3ofp+LL8E+pK/JuPLPggVAIaEuhvIz4qNcf3nA1Xn2o/7fb7s/TYpHhwGDv1ZU3PkBluUVaF8PyCHcm48cKLWQ==",
  "dev": true,

# But directory does not exist
$ test -d node_modules/tailwindcss && echo "EXISTS" || echo "NOT FOUND"
NOT FOUND

# NPM reports empty when checking
$ npm list tailwindcss
smartbudget@1.0.0 /tmp/smartbudget
└── (empty)
```

## Impact on Testing

**Cannot Complete:**
- ❌ Task 3: Run Lighthouse Benchmarks
- ❌ Task 4: Execute E2E Test Suite
- ❌ Task 5: Bundle Size Optimization
- ❌ Task 6: Run Accessibility Audit in Production Build

All testing tasks require a running application, which cannot be started due to missing dependencies.

## Recommended Resolution

This appears to be a corruption in the npm package installation system or environment. Recommended approaches:

### Option 1: Environment Investigation
1. Check npm cache: `npm cache verify`
2. Clear npm cache: `npm cache clean --force`
3. Check for filesystem issues (permissions, disk space, corruption)
4. Try in a different directory or environment
5. Check npm version compatibility issues

### Option 2: Alternative Package Manager
1. Try using `yarn` instead of `npm`
2. Try using `pnpm` instead of `npm`

### Option 3: Manual Dependency Installation
1. Manually download and extract tailwindcss package
2. Place in node_modules directory
3. Verify this is not a systemic issue

### Option 4: Package.json Reconstruction
1. Create minimal package.json with only essential dependencies
2. Gradually add back packages to identify the problematic configuration

## Next Steps

**BLOCKER MUST BE RESOLVED BEFORE CONTINUING WITH:**
- Lighthouse performance benchmarks
- E2E test execution
- Bundle size analysis
- Accessibility audits

**Current Status:** Unable to proceed with Task 3 until dependency installation issue is resolved.

---

## Lighthouse Benchmark Plan (Once Unblocked)

When the application can be successfully started, the following Lighthouse audits should be performed:

### Pages to Test
1. Dashboard (`/`)
2. Transactions (`/transactions`)
3. Budgets (`/budgets`)
4. Accounts (`/accounts`)
5. Goals (`/goals`)

### Metrics to Capture
- Performance Score (Target: ≥ 90)
- Accessibility Score (Target: 100)
- Best Practices Score (Target: ≥ 90)
- SEO Score (Target: ≥ 90)

### Specific Performance Metrics
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Total Blocking Time (TBT)
- Cumulative Layout Shift (CLS)
- Speed Index

### Test Command Template
```bash
npx lighthouse http://localhost:3000/[page] \
  --output=json \
  --output=html \
  --output-path=./lighthouse-reports/[page-name] \
  --chrome-flags="--headless --no-sandbox" \
  --only-categories=performance,accessibility,best-practices,seo
```

---

## Results

**Status:** NOT STARTED - Blocked by dependency installation issue

Results will be documented here once the application can be successfully built and started.
