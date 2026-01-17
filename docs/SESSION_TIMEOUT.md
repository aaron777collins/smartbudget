# Session Timeout & Inactivity Detection

Comprehensive documentation for session timeout and inactivity detection features in SmartBudget.

## Table of Contents

- [Overview](#overview)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Implementation Details](#implementation-details)
- [User Experience](#user-experience)
- [Security Considerations](#security-considerations)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Overview

SmartBudget implements comprehensive session timeout and inactivity detection to enhance security and protect user accounts from unauthorized access. The system automatically:

- Tracks user activity across the application
- Warns users before their session expires
- Automatically logs out inactive users
- Logs all session-related security events

### Key Features

- **Inactivity Timeout**: 30 minutes of inactivity triggers session expiration
- **Maximum Session Age**: 4 hours maximum session lifetime
- **Warning System**: 5-minute warning before expiration
- **Automatic Logout**: Seamless logout when session expires
- **Activity Tracking**: Real-time monitoring of user interactions
- **Security Logging**: All session events are audited

## Configuration

### Session Timeout Settings

Located in `src/lib/session-manager.ts`:

```typescript
export const SESSION_CONFIG = {
  MAX_SESSION_AGE: 4 * 60 * 60 * 1000,     // 4 hours (14,400,000 ms)
  INACTIVITY_TIMEOUT: 30 * 60 * 1000,      // 30 minutes (1,800,000 ms)
  WARNING_THRESHOLD: 5 * 60 * 1000,        // 5 minutes (300,000 ms)
}
```

### Modifying Timeouts

To change timeout values, update `SESSION_CONFIG`:

```typescript
// Example: Reduce inactivity timeout to 15 minutes
export const SESSION_CONFIG = {
  MAX_SESSION_AGE: 4 * 60 * 60 * 1000,
  INACTIVITY_TIMEOUT: 15 * 60 * 1000,  // Changed to 15 minutes
  WARNING_THRESHOLD: 5 * 60 * 1000,
}
```

**⚠️ Important**: After changing `SESSION_CONFIG`, also update the NextAuth session configuration in `src/auth.ts`:

```typescript
session: {
  strategy: "jwt",
  maxAge: SESSION_CONFIG.MAX_SESSION_AGE / 1000, // Convert ms to seconds
},
```

### Environment Variables

No additional environment variables are required for session timeout. The feature uses the existing NextAuth configuration.

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐     ┌──────────────────────────┐ │
│  │  useSessionTimeout   │────▶│ SessionTimeoutModal      │ │
│  │  (Activity Monitor)  │     │ (Warning UI)             │ │
│  └──────────────────────┘     └──────────────────────────┘ │
│            │                              │                  │
│            ▼                              ▼                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              SessionProvider (Wrapper)                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Server Middleware                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  validateSession() - Check for expiration              │ │
│  │  - Checks inactivity (30 min)                          │ │
│  │  - Checks max age (4 hours)                            │ │
│  │  - Updates lastActivityAt                              │ │
│  │  - Logs session events                                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        Database                              │
├─────────────────────────────────────────────────────────────┤
│  User Table:                                                 │
│  - lastActivityAt: DateTime?                                 │
│  - sessionCreatedAt: DateTime?                               │
│                                                               │
│  SecurityEvent Table:                                        │
│  - SESSION_EXPIRED events                                    │
│  - Audit trail                                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Login**: User logs in → `initializeSession()` sets timestamps
2. **Activity**: User interacts → `updateLastActivity()` updates timestamp
3. **Validation**: Each request → Middleware validates session
4. **Warning**: 5 min before timeout → Client shows warning modal
5. **Expiration**: Timeout reached → Auto-logout and redirect
6. **Logout**: User logs out → `clearSession()` clears timestamps

## Database Schema

### User Model Changes

Added fields to track session state:

```prisma
model User {
  // ... existing fields
  lastActivityAt       DateTime?  // Track last user activity
  sessionCreatedAt     DateTime?  // When current session was created
  // ... other fields
}
```

### Migration

Migration file: `prisma/migrations/20260115160000_add_session_tracking/migration.sql`

```sql
ALTER TABLE "User"
ADD COLUMN "lastActivityAt" TIMESTAMP(3),
ADD COLUMN "sessionCreatedAt" TIMESTAMP(3);
```

To apply the migration:

```bash
npx prisma migrate deploy
```

### Security Events

Session expiration events are logged to the `SecurityEvent` table:

```typescript
{
  eventType: 'SESSION_EXPIRED',
  severity: 'INFO',
  description: 'Session expired due to inactivity (30 minutes)',
  userId: '<user-id>',
  ipAddress: '<ip>',
  userAgent: '<user-agent>',
  createdAt: '<timestamp>'
}
```

## Implementation Details

### 1. Session Manager Library

**File**: `src/lib/session-manager.ts`

Core functions:

#### `initializeSession(userId: string)`
Initializes a new session on login by setting both timestamps to now.

```typescript
await initializeSession(userId)
// Sets: sessionCreatedAt = now, lastActivityAt = now
```

#### `updateLastActivity(userId: string)`
Updates the last activity timestamp to extend the session.

```typescript
await updateLastActivity(userId)
// Updates: lastActivityAt = now
```

#### `validateSession(userId, context)`
Validates session and returns result with expiration reason.

```typescript
const result = await validateSession(userId, { ip, userAgent })
// Returns: { valid: boolean, reason?: string, timeRemaining?: number }
```

#### `clearSession(userId: string)`
Clears session data on logout.

```typescript
await clearSession(userId)
// Sets: sessionCreatedAt = null, lastActivityAt = null
```

### 2. Middleware Integration

**File**: `src/middleware.ts`

The middleware validates sessions on every request to protected routes:

```typescript
export default auth(async (req) => {
  // ... auth checks

  if (isAuthenticated && !isPublicRoute && req.auth?.user?.id) {
    const validation = await validateSession(req.auth.user.id, context)

    if (!validation.valid) {
      // Redirect to signin with session_expired flag
      return NextResponse.redirect(signInUrl)
    }
  }

  return NextResponse.next()
})
```

### 3. Client-Side Monitoring

**File**: `src/hooks/useSessionTimeout.ts`

Custom React hook that:
- Monitors user activity (mouse, keyboard, scroll, touch)
- Calculates time remaining until expiration
- Determines when to show warning
- Throttles activity updates (every 5 seconds max)

```typescript
const {
  timeRemaining,        // milliseconds until timeout
  showWarning,          // true if within 5 min of timeout
  isExpired,            // true if session expired
  resetActivity,        // function to extend session
  timeRemainingFormatted  // "5:30" formatted string
} = useSessionTimeout()
```

### 4. Warning Modal

**File**: `src/components/session-timeout-modal.tsx`

Interactive modal that:
- Appears 5 minutes before timeout
- Shows countdown timer
- Offers "Continue Session" or "Logout" options
- Auto-redirects on expiration

### 5. Auth Configuration

**File**: `src/auth.ts`

NextAuth configuration updated to:
- Set JWT maxAge to 4 hours
- Initialize session on login
- Add session timestamps to JWT token

### 6. TypeScript Types

**File**: `src/types/next-auth.d.ts`

Extended NextAuth types to include:
```typescript
interface Session {
  sessionCreatedAt?: number
}

interface JWT {
  sessionCreatedAt?: number
}
```

## User Experience

### Login Flow

1. User enters credentials and clicks "Sign in"
2. Server validates credentials
3. `initializeSession()` sets timestamps
4. User redirected to dashboard
5. Session active, no warnings

### Active Session

1. User interacts with application
2. Client throttles activity updates
3. Middleware updates `lastActivityAt` on requests
4. Session remains valid
5. No interruptions

### Approaching Timeout

1. 25 minutes of inactivity pass
2. 5 minutes remaining until timeout
3. **Warning modal appears**:
   ```
   ⚠️ Session Timeout Warning
   Your session will expire in 4:30 due to inactivity.
   Would you like to continue your session?

   [Continue Session]  [Logout]
   ```
4. User clicks "Continue Session"
5. Activity timestamp updated
6. Modal disappears
7. Session extended for another 30 minutes

### Session Expiration

1. 30 minutes of inactivity pass (no "Continue" clicked)
2. Client detects expiration
3. **Expiration modal appears briefly**:
   ```
   🔴 Session Expired
   Your session has expired due to inactivity.
   You will be redirected to the login page.
   ```
4. Auto-redirect to signin page
5. Information message displayed:
   ```
   ⚠️ Your session has expired due to inactivity. Please sign in again.
   ```

### Manual Logout

1. User clicks "Sign out" in header
2. Logout API called
3. `clearSession()` clears timestamps
4. Security event logged
5. NextAuth signOut() called
6. User redirected to home page

## Security Considerations

### Threat Mitigation

| Threat | Mitigation |
|--------|------------|
| Session hijacking | Short session lifetimes (4 hours max) |
| Unattended sessions | 30-minute inactivity timeout |
| Session fixation | Session regenerated on login |
| Credential theft | Account lockout after failed attempts |
| Session replay | Timestamps prevent stale session reuse |

### Security Features

1. **Dual Timeout Mechanism**:
   - Inactivity timeout (30 min)
   - Maximum session age (4 hours)
   - Whichever comes first triggers expiration

2. **Audit Logging**:
   - All session expirations logged
   - Includes reason (inactive vs too old)
   - Tracks IP and user agent
   - Searchable audit trail

3. **Server-Side Validation**:
   - Middleware validates every request
   - Cannot be bypassed client-side
   - Database timestamps are source of truth

4. **Graceful Degradation**:
   - If validation fails, assume invalid (fail secure)
   - Non-blocking activity updates
   - Errors don't crash the application

### Privacy Considerations

- **No sensitive data in JWT**: Only user ID and username stored
- **Activity tracking**: Timestamps only, no activity details
- **IP logging**: For security events, can be disabled if needed
- **GDPR compliant**: Activity data included in data export

## Testing

### Manual Testing

#### Test Inactivity Timeout

1. Sign in to the application
2. Wait 25 minutes without interacting
3. **Expected**: Warning modal appears after 25 minutes
4. Wait 5 more minutes without clicking "Continue"
5. **Expected**: Session expires, redirect to signin with message

#### Test Warning Reset

1. Sign in to the application
2. Wait 25 minutes without interacting
3. **Expected**: Warning modal appears
4. Click "Continue Session"
5. **Expected**: Modal disappears, session extended
6. Wait another 25 minutes
7. **Expected**: Warning appears again

#### Test Max Session Age

1. Sign in to the application
2. Keep interacting continuously for 4 hours
3. **Expected**: Session expires after 4 hours regardless of activity
4. **Expected**: Redirect to signin

#### Test Activity Tracking

1. Sign in to the application
2. Interact (click, type, scroll) every few minutes
3. Monitor network tab for activity updates
4. **Expected**: `lastActivityAt` updated regularly
5. **Expected**: No timeout warnings appear

### Automated Testing

#### Unit Tests

```typescript
// Test session validation
describe('validateSession', () => {
  it('should return valid for recent activity', async () => {
    // Setup user with recent activity
    const result = await validateSession(userId)
    expect(result.valid).toBe(true)
  })

  it('should return invalid for inactive session', async () => {
    // Setup user with old lastActivityAt (31+ min ago)
    const result = await validateSession(userId)
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('inactive')
  })

  it('should return invalid for old session', async () => {
    // Setup user with old sessionCreatedAt (4+ hours ago)
    const result = await validateSession(userId)
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('too_old')
  })
})
```

#### Integration Tests

```typescript
// Test middleware session validation
describe('Middleware Session Validation', () => {
  it('should allow access with valid session', async () => {
    const response = await request(app)
      .get('/dashboard')
      .set('Cookie', validSessionCookie)
    expect(response.status).toBe(200)
  })

  it('should redirect expired session to signin', async () => {
    const response = await request(app)
      .get('/dashboard')
      .set('Cookie', expiredSessionCookie)
    expect(response.status).toBe(302)
    expect(response.headers.location).toContain('/auth/signin')
    expect(response.headers.location).toContain('session_expired=true')
  })
})
```

### Performance Testing

Monitor the impact of session validation:

```bash
# Check query performance
EXPLAIN ANALYZE SELECT "lastActivityAt", "sessionCreatedAt"
FROM "User" WHERE id = '<user-id>';

# Should use primary key index, very fast
# Expected: < 1ms execution time
```

## Troubleshooting

### Issue: Sessions expiring too quickly

**Symptoms**: Users report being logged out after < 30 minutes

**Possible Causes**:
1. Clock drift between client and server
2. Activity tracking not working
3. Database not updating timestamps

**Solutions**:
1. Check `SESSION_CONFIG` values are correct
2. Verify activity events are firing in browser console:
   ```javascript
   // Add to useSessionTimeout hook for debugging
   console.log('Activity updated:', new Date())
   ```
3. Check database `lastActivityAt` is being updated:
   ```sql
   SELECT id, username, "lastActivityAt"
   FROM "User"
   WHERE id = '<user-id>';
   ```
4. Verify middleware is calling `validateSession()`

### Issue: Warning modal not appearing

**Symptoms**: Session expires without warning

**Possible Causes**:
1. Modal component not rendered
2. Hook not calculating correctly
3. Threshold misconfigured

**Solutions**:
1. Check `SessionTimeoutModal` is included in `SessionProvider`
2. Add debug logging to `useSessionTimeout`:
   ```typescript
   console.log('Session state:', {
     timeRemaining,
     showWarning,
     isExpired
   })
   ```
3. Verify `WARNING_THRESHOLD` in `SESSION_CONFIG`
4. Check browser console for React errors

### Issue: Session not being validated

**Symptoms**: Inactive sessions not expiring

**Possible Causes**:
1. Middleware not running
2. Database connection issues
3. Validation function errors

**Solutions**:
1. Check middleware is configured correctly in `middleware.ts`
2. Verify middleware matcher includes protected routes
3. Check server logs for validation errors:
   ```bash
   # Look for "Session validation error" in logs
   grep "Session validation error" logs/application.log
   ```
4. Test database connectivity:
   ```bash
   npx prisma db push --accept-data-loss
   ```

### Issue: Multiple logout events

**Symptoms**: User sees multiple logout attempts in audit log

**Possible Causes**:
1. Multiple browser tabs open
2. Concurrent requests during expiration
3. Race condition in validation

**Solutions**:
1. This is expected behavior - each tab validates independently
2. Audit log should show multiple SESSION_EXPIRED events (normal)
3. Ensure `validateSession()` is idempotent (already implemented)
4. If excessive, consider adding session token to prevent duplicates

### Issue: Database migration failed

**Symptoms**: Error when running `prisma migrate deploy`

**Solutions**:
1. Check database connection:
   ```bash
   npx prisma db pull
   ```
2. Manually apply migration:
   ```sql
   ALTER TABLE "User"
   ADD COLUMN IF NOT EXISTS "lastActivityAt" TIMESTAMP(3),
   ADD COLUMN IF NOT EXISTS "sessionCreatedAt" TIMESTAMP(3);
   ```
3. Mark migration as applied:
   ```bash
   npx prisma migrate resolve --applied 20260115160000_add_session_tracking
   ```

## Best Practices

### For Developers

1. **Never bypass session validation** in middleware or API routes
2. **Always call `clearSession()`** when implementing custom logout
3. **Test with realistic timeouts** during development (reduce to 2 min for testing)
4. **Monitor security events** for unusual patterns
5. **Keep timestamps in sync** between JWT and database

### For Administrators

1. **Review timeout settings** based on user feedback and security policy
2. **Monitor session expiration events** in audit logs
3. **Educate users** about session timeout behavior
4. **Plan for timezone differences** when analyzing logs
5. **Regular security audits** of session management

### For Users

1. **Use "Continue Session"** when warning appears if still working
2. **Close browser tabs** when done to free resources
3. **Expect timeout** on shared/public computers (security feature)
4. **Contact support** if experiencing frequent unexpected logouts

## Future Enhancements

Potential improvements for future versions:

1. **Configurable Timeouts per User Role**:
   - Admin: 8 hours max session
   - Regular user: 4 hours max session
   - Readonly user: 1 hour max session

2. **Remember Me Option**:
   - Extended session lifetime (7 days)
   - Secure persistent token
   - User opt-in required

3. **Session Management Dashboard**:
   - View active sessions
   - Revoke sessions remotely
   - See device/location information

4. **Adaptive Timeouts**:
   - Shorter timeout for sensitive operations
   - Longer timeout for trusted devices
   - Risk-based session management

5. **Push Notifications**:
   - Browser notification before expiration
   - Works even in background tabs

6. **Session Transfer**:
   - Transfer session between devices
   - Secure QR code authentication

## References

- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Client API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-3/)

## Support

For issues or questions:
1. Check this documentation
2. Review audit logs for session events
3. Test with reduced timeouts for faster debugging
4. Open an issue on GitHub with logs and reproduction steps

---

**Last Updated**: 2026-01-15
**Version**: 1.0.0
**Author**: SmartBudget Security Team
