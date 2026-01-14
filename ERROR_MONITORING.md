# Error Monitoring and Handling

## Overview

SmartBudget uses **Sentry** for comprehensive error monitoring and tracking. This document explains how error handling is implemented and how to configure Sentry for your deployment.

## Architecture

### Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Application Error                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ├─→ Client-Side Error
                      │   ├─→ React Error Boundary catches error
                      │   ├─→ Sentry.captureException() logs to Sentry
                      │   └─→ User sees friendly error UI with retry option
                      │
                      └─→ Server-Side Error (API Route)
                          ├─→ try-catch block catches error
                          ├─→ ErrorHandler.apiErrorResponse() logs to Sentry
                          └─→ Client receives structured error response
```

## Configuration

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Sentry DSN (Data Source Name)
# Get this from: https://sentry.io/settings/[org]/projects/[project]/keys/

# Server-side error tracking
SENTRY_DSN="https://[key]@[org].ingest.sentry.io/[project]"

# Client-side error tracking (must start with NEXT_PUBLIC_)
NEXT_PUBLIC_SENTRY_DSN="https://[key]@[org].ingest.sentry.io/[project]"

# Sentry organization and project (for source map uploads)
SENTRY_ORG="your-org-slug"
SENTRY_PROJECT="your-project-slug"

# Optional: Authentication token for source map uploads during build
# Get this from: https://sentry.io/settings/account/api/auth-tokens/
SENTRY_AUTH_TOKEN="your-auth-token"
```

### 2. Sentry Project Setup

1. **Create a Sentry account**: https://sentry.io/signup/
2. **Create a new project**:
   - Go to Settings → Projects → Create Project
   - Choose "Next.js" as the platform
   - Name your project (e.g., "smartbudget")
3. **Get your DSN**:
   - Go to Settings → Projects → [Your Project] → Client Keys (DSN)
   - Copy the DSN and add it to your `.env` file

### 3. Configuration Files

The following Sentry configuration files are automatically loaded:

- **`sentry.client.config.ts`**: Client-side configuration (browser)
  - Error tracking with replay sessions
  - Session replay for debugging user interactions
  - Browser tracing for performance monitoring

- **`sentry.server.config.ts`**: Server-side configuration (Node.js)
  - API error tracking
  - Prisma integration for database query monitoring
  - HTTP request tracing

- **`sentry.edge.config.ts`**: Edge runtime configuration (Vercel Edge)
  - Lightweight error tracking for edge functions

- **`next.config.js`**: Next.js integration
  - Automatic source map uploads (if `SENTRY_AUTH_TOKEN` is set)
  - Build-time Sentry plugin integration

## Features

### 1. React Error Boundaries

Error boundaries catch JavaScript errors in React components and display fallback UI:

```tsx
import { ErrorBoundary } from '@/components/error-boundary';

// Wrap your component
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// Or use the lightweight wrapper for sections
import { ErrorBoundaryWrapper } from '@/components/error-boundary';

<ErrorBoundaryWrapper name="Dashboard Chart">
  <DashboardChart />
</ErrorBoundaryWrapper>
```

**Features:**
- Catches React component errors
- Displays user-friendly error UI
- Logs errors to Sentry automatically
- Provides "Try Again" and "Go to Dashboard" buttons
- Shows error details in development mode

### 2. Global Error Pages

Next.js provides two special error pages:

- **`/src/app/error.tsx`**: Route-level error page (catches errors in any nested route)
- **`/src/app/global-error.tsx`**: Root-level error page (catches errors in root layout)

Both pages:
- Automatically log errors to Sentry
- Display user-friendly error messages
- Provide retry and navigation options
- Show error details in development mode

### 3. API Error Handler

The `ErrorHandler` class provides consistent error handling for API routes:

```typescript
import { ErrorHandler, handleDatabaseError, handleAuthError } from '@/lib/error-handler';

// In your API route
export async function GET(request: Request) {
  try {
    // Your code here
    const data = await fetchData();
    return NextResponse.json(data);
  } catch (error) {
    // Automatic error logging and response
    return ErrorHandler.apiErrorResponse(error, {
      statusCode: 500,
      message: 'Failed to fetch data',
      source: 'api/data',
    });
  }
}

// Database error handling
try {
  await prisma.transaction.create({ data });
} catch (error) {
  return handleDatabaseError(error);
}

// Authentication error handling
if (!session) {
  return handleAuthError('You must be logged in');
}
```

**Features:**
- Logs all errors to Sentry with context
- Returns standardized error responses
- Includes error details in development mode
- Filters sensitive data from logs
- Categorizes errors by type (database, auth, validation)

### 4. User Context Tracking

The `SentryUserContext` component automatically tracks authenticated users:

```tsx
// Already integrated in root layout
<SessionProvider>
  <SentryUserContext />
  {/* Rest of your app */}
</SessionProvider>
```

**Features:**
- Automatically sets Sentry user context when logged in
- Clears user context on logout
- Tracks user ID, email, and username
- Links errors to specific users for debugging

### 5. Error Logging Utilities

Use the `ErrorHandler` class for manual error logging:

```typescript
import { ErrorHandler, ErrorSeverity } from '@/lib/error-handler';

// Log an error
ErrorHandler.logError(error, {
  severity: ErrorSeverity.Error,
  source: 'payment-processing',
  userId: user.id,
  tags: { payment_method: 'credit_card' },
  extra: { amount: 100, currency: 'USD' },
});

// Log a warning
ErrorHandler.logWarning('Rate limit approaching', {
  source: 'api-rate-limiter',
  tags: { endpoint: '/api/transactions' },
  extra: { currentRate: 95, limit: 100 },
});

// Log informational message
ErrorHandler.logInfo('Large import completed', {
  source: 'transaction-import',
  extra: { count: 5000, duration: 2500 },
});

// Add breadcrumbs for debugging
ErrorHandler.addBreadcrumb('User clicked export button', 'user-action', {
  format: 'csv',
  dateRange: 'last-30-days',
});
```

## Data Privacy

Sentry is configured to automatically filter sensitive data:

### Automatically Filtered:
- **Cookies**: All cookies are removed from error reports
- **Authorization headers**: Auth tokens are removed
- **Sensitive query parameters**: `token`, `password`, `secret`, `api_key` are redacted

### Session Replay Privacy:
- **Text masking**: All text content is masked by default
- **Media blocking**: All images and videos are blocked
- **Only enabled on errors**: Session replays are only captured when errors occur

### User Data:
- Only user ID, email, and username are tracked
- No financial data or transaction details are sent to Sentry
- User context can be disabled by removing `<SentryUserContext />` from layout

## Monitoring in Production

### 1. Error Dashboard

Access your Sentry dashboard at: `https://sentry.io/organizations/[org]/issues/`

**Key metrics:**
- Error count and frequency
- Affected users
- Stack traces with source maps
- User context and breadcrumbs
- Session replays for critical errors

### 2. Alerts

Configure alerts in Sentry to get notified:
- Settings → Alerts → Create Alert Rule
- Choose conditions (e.g., "New issue", "Error spike")
- Select notification channels (email, Slack, PagerDuty)

### 3. Performance Monitoring

Sentry also tracks performance:
- API response times
- Database query performance
- Frontend load times
- Core Web Vitals

Access performance data at: `https://sentry.io/organizations/[org]/performance/`

## Testing Error Handling

### Local Development

Even without a Sentry DSN, error handling works:
- Errors are logged to console
- Error boundaries display fallback UI
- API errors return structured responses

### Testing with Sentry

To test Sentry integration:

1. **Trigger a client-side error**:
   ```tsx
   // Add to any component for testing
   <button onClick={() => { throw new Error('Test error'); }}>
     Trigger Error
   </button>
   ```

2. **Trigger a server-side error**:
   ```typescript
   // In any API route
   export async function GET() {
     throw new Error('Test API error');
   }
   ```

3. **Check Sentry dashboard**:
   - Errors should appear within seconds
   - Verify user context is present (if logged in)
   - Check stack traces have source maps

## Best Practices

### 1. Error Context

Always provide context when logging errors:

```typescript
// Bad
ErrorHandler.logError(error);

// Good
ErrorHandler.logError(error, {
  source: 'transaction-import',
  userId: session.user.id,
  tags: { fileType: 'csv', bank: 'CIBC' },
  extra: { fileName: file.name, fileSize: file.size },
});
```

### 2. Error Boundaries

Place error boundaries at strategic levels:

```tsx
// Global error boundary (already in root layout)
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Feature-level error boundaries
<ErrorBoundaryWrapper name="Dashboard">
  <Dashboard />
</ErrorBoundaryWrapper>

// Component-level for critical sections
<ErrorBoundaryWrapper name="Transaction Import">
  <TransactionImportForm />
</ErrorBoundaryWrapper>
```

### 3. API Error Handling

Use the provided helper functions:

```typescript
// Use specialized handlers
return handleDatabaseError(error);  // For Prisma errors
return handleAuthError();           // For authentication errors
return handleValidationError('Invalid input', errors); // For validation

// Or use the generic handler with context
return ErrorHandler.apiErrorResponse(error, {
  statusCode: 400,
  message: 'Invalid transaction data',
  source: 'api/transactions',
  userId: session.user.id,
});
```

### 4. User-Friendly Messages

Never expose raw error messages to users:

```typescript
// Bad
return NextResponse.json({ error: error.message }, { status: 500 });

// Good
return ErrorHandler.apiErrorResponse(error, {
  message: 'Failed to import transactions. Please try again.',
  source: 'transaction-import',
});
```

## Troubleshooting

### Sentry Not Capturing Errors

1. **Check environment variables**: Ensure `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` are set
2. **Check Sentry project**: Verify project is active and DSN is correct
3. **Check console**: Look for Sentry initialization errors
4. **Check filters**: Error may be filtered by `ignoreErrors` or `beforeSend`

### Source Maps Not Working

1. **Set `SENTRY_AUTH_TOKEN`**: Required for source map uploads
2. **Check build output**: Look for "Sentry: Uploading source maps" message
3. **Verify project settings**: Settings → Projects → [Project] → Source Maps
4. **Check release matching**: Ensure release versions match between build and runtime

### High Error Volume

1. **Review `ignoreErrors`**: Add common non-actionable errors to filter list
2. **Adjust sample rates**: Reduce `tracesSampleRate` and `replaysSessionSampleRate`
3. **Set up rate limiting**: Settings → Projects → [Project] → Inbound Filters
4. **Group similar errors**: Use fingerprinting to deduplicate errors

## Costs and Quotas

Sentry has generous free tier:
- **Errors**: 5,000 errors/month
- **Performance**: 10,000 transactions/month
- **Session Replay**: 50 replays/month

For production at scale:
- Monitor your quota usage: Settings → Usage & Billing
- Adjust sample rates to stay within limits
- Consider upgrading to paid plan for higher volumes

## Additional Resources

- **Sentry Documentation**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Next.js Error Handling**: https://nextjs.org/docs/app/building-your-application/routing/error-handling
- **React Error Boundaries**: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
- **Sentry Best Practices**: https://docs.sentry.io/product/best-practices/

## Summary

The SmartBudget error monitoring system provides:

✅ **Comprehensive error tracking** with Sentry integration
✅ **User-friendly error UI** with recovery options
✅ **Automatic error logging** for all errors
✅ **User context tracking** for authenticated users
✅ **Privacy-first approach** with automatic data filtering
✅ **Production-ready monitoring** with alerts and dashboards
✅ **Developer-friendly utilities** for consistent error handling

This implementation ensures that no errors go unnoticed while maintaining user privacy and providing a great user experience even when things go wrong.
