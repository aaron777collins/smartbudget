# Testing Documentation

## Overview

SmartBudget uses a comprehensive testing strategy with three levels of testing:

1. **Unit Tests** - Testing individual functions and components in isolation
2. **Integration Tests** - Testing API routes and data flows
3. **E2E Tests** - Testing complete user workflows in a real browser

## Testing Stack

- **Unit & Integration Testing**: Vitest + React Testing Library
- **E2E Testing**: Playwright
- **Assertion Library**: @testing-library/jest-dom
- **Mocking**: Vitest's built-in mocking capabilities

## Setup

### Install Dependencies

All testing dependencies are included in `package.json`. To install:

```bash
npm install
```

### Install Playwright Browsers

For E2E tests, install Playwright browsers:

```bash
npx playwright install
```

## Running Tests

### Unit & Integration Tests

```bash
# Run all unit tests once
npm run test

# Run tests in watch mode (during development)
npm run test:watch

# Run tests with UI (interactive mode)
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug
```

### Run All Tests

```bash
npm run test:all
```

## Test Structure

### Unit Tests

Located alongside source files with `.test.ts` or `.test.tsx` extension:

```
src/
  lib/
    utils.ts
    utils.test.ts          # Unit tests for utils
    timeframe.ts
    timeframe.test.ts      # Unit tests for timeframe utilities
    merchant-normalizer.ts
    merchant-normalizer.test.ts
```

**Example unit test:**

```typescript
// src/lib/utils.test.ts
import { describe, it, expect } from 'vitest'
import { formatCurrency } from './utils'

describe('formatCurrency', () => {
  it('should format standard amounts', () => {
    expect(formatCurrency(100)).toBe('$100.00')
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })
})
```

### Integration Tests

API route tests located alongside API routes:

```
src/
  app/
    api/
      categories/
        route.ts
        route.test.ts      # Integration tests for categories API
```

**Example integration test:**

```typescript
// src/app/api/categories/route.test.ts
import { describe, it, expect, vi } from 'vitest'
import { GET } from './route'
import { createMockRequest, mockSession } from '@/test/api-helpers'

vi.mock('@/auth')
vi.mock('@/lib/prisma')

describe('GET /api/categories', () => {
  it('should return categories for authenticated user', async () => {
    // Test implementation
  })
})
```

### E2E Tests

Located in the `e2e/` directory:

```
e2e/
  homepage.spec.ts       # Homepage E2E tests
  dashboard.spec.ts      # Dashboard E2E tests
  transactions.spec.ts   # Transactions E2E tests
```

**Example E2E test:**

```typescript
// e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test'

test('should load the dashboard page', async ({ page }) => {
  await page.goto('/dashboard')
  const heading = page.getByRole('heading', { name: /dashboard/i })
  await expect(heading).toBeVisible()
})
```

## Test Helpers

### API Test Helpers

Located in `src/test/api-helpers.ts`:

- `createMockRequest()` - Create mock NextRequest objects
- `mockSession` - Mock authenticated session
- `parseJsonResponse()` - Parse JSON from NextResponse

### Test Setup

Located in `src/test/setup.ts`:

- Global test configuration
- Mock setup for Next.js modules (router, headers)
- Test cleanup between tests

## Configuration Files

### Vitest Configuration

`vitest.config.ts`:

- Environment: jsdom (for React component testing)
- Setup files: `src/test/setup.ts`
- Coverage: v8 provider with text, JSON, and HTML reports
- Path aliases: `@/` maps to `./src/`

### Playwright Configuration

`playwright.config.ts`:

- Test directory: `./e2e`
- Browser projects: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- Base URL: `http://localhost:3000`
- Automatic dev server startup
- Retry: 2x in CI, 0x locally
- Screenshots and traces on failure

## Writing Tests

### Unit Test Best Practices

1. **Test one thing at a time** - Each test should verify a single behavior
2. **Use descriptive names** - Test names should clearly state what they test
3. **Arrange-Act-Assert** - Structure tests clearly
4. **Mock external dependencies** - Isolate the unit under test
5. **Test edge cases** - Empty inputs, null values, boundary conditions

### Integration Test Best Practices

1. **Mock authentication** - Use `mockSession` helper
2. **Mock database** - Use Vitest mocks for Prisma calls
3. **Test error cases** - Verify error handling and status codes
4. **Verify request/response** - Check query parameters and response structure

### E2E Test Best Practices

1. **Test user workflows** - Complete user journeys, not isolated actions
2. **Use semantic selectors** - Prefer `getByRole`, `getByLabel` over CSS selectors
3. **Wait for elements** - Use `await expect().toBeVisible()` for dynamic content
4. **Handle authentication** - Set up auth state before tests if needed
5. **Test accessibility** - Include keyboard navigation and ARIA attributes

## Code Coverage

Generate coverage reports:

```bash
npm run test:coverage
```

Coverage reports are generated in:
- `coverage/` directory
- View HTML report: `coverage/index.html`

**Coverage Goals:**
- Unit tests: >80% coverage
- Integration tests: Critical API routes covered
- E2E tests: Critical user flows covered

## Continuous Integration

Tests should be run in CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run unit tests
  run: npm run test

- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e
```

## Troubleshooting

### Vitest Not Found

If you see "vitest: not found", try:

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Or use npx
npx vitest run
```

### Playwright Browsers Not Installed

```bash
npx playwright install
```

### Tests Failing Locally

1. Ensure database is running and migrated
2. Check environment variables
3. Clear test database between runs
4. Restart dev server

### Mock Issues

If mocks aren't working:
1. Ensure mocks are defined before imports
2. Clear mocks between tests with `vi.clearAllMocks()`
3. Check mock paths match actual module paths

## Example Test Coverage

### Current Test Files

**Unit Tests:**
- ✅ `src/lib/utils.test.ts` - Utility function tests
- ✅ `src/lib/timeframe.test.ts` - Timeframe calculation tests
- ✅ `src/lib/merchant-normalizer.test.ts` - Merchant normalization tests

**Integration Tests:**
- ✅ `src/app/api/categories/route.test.ts` - Categories API tests

**E2E Tests:**
- ✅ `e2e/homepage.spec.ts` - Homepage tests
- ✅ `e2e/dashboard.spec.ts` - Dashboard tests
- ✅ `e2e/transactions.spec.ts` - Transactions tests

### Recommended Additional Tests

**Unit Tests:**
- CSV parser tests
- OFX parser tests
- Categorization rules tests
- Budget calculation tests

**Integration Tests:**
- Transactions API tests
- Accounts API tests
- Budget API tests
- Insights API tests

**E2E Tests:**
- Transaction import flow
- Budget creation flow
- Account management flow
- Authentication flow

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)

## Support

For questions or issues with tests:
1. Check this documentation
2. Review existing test files for examples
3. Check Vitest/Playwright documentation
4. Open an issue in the project repository
