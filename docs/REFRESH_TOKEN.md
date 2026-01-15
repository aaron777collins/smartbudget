# Refresh Token System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Security Features](#security-features)
4. [API Endpoints](#api-endpoints)
5. [Client Integration](#client-integration)
6. [Token Lifecycle](#token-lifecycle)
7. [Theft Detection](#theft-detection)
8. [Configuration](#configuration)
9. [Database Schema](#database-schema)
10. [Security Considerations](#security-considerations)
11. [Testing](#testing)
12. [Troubleshooting](#troubleshooting)
13. [Best Practices](#best-practices)

---

## Overview

SmartBudget implements a secure refresh token system to complement NextAuth's JWT-based authentication. This system provides:

- **Long-lived refresh tokens** (7 days) alongside short-lived access tokens (15 minutes)
- **Automatic token rotation** on every refresh to detect token theft
- **Token family tracking** to identify and respond to suspicious activity
- **Comprehensive audit logging** for all token operations
- **Graceful token revocation** on logout and password changes

### Why Refresh Tokens?

While NextAuth provides excellent authentication, refresh tokens add:
- Shorter access token lifetimes (better security)
- Ability to revoke sessions without database lookups on every request
- Detection of token theft through rotation patterns
- Support for "Remember Me" functionality
- Better control over session management across devices

---

## Architecture

### Components

```
┌─────────────────┐
│   Client App    │
│  (Next.js UI)   │
└────────┬────────┘
         │
         │ 1. Login (NextAuth)
         ▼
┌─────────────────┐
│  POST /auth/    │
│    token        │ ◄─── Creates refresh token after NextAuth login
└────────┬────────┘
         │
         │ 2. Returns refresh token
         ▼
┌─────────────────┐
│   Client        │
│  (Stores RT in  │
│   httpOnly      │
│   cookie)       │
└────────┬────────┘
         │
         │ 3. Access token expires
         ▼
┌─────────────────┐
│  POST /auth/    │
│    refresh      │ ◄─── Rotates token, returns new access + refresh tokens
└────────┬────────┘
         │
         │ 4. Logout
         ▼
┌─────────────────┐
│  POST /auth/    │
│    logout       │ ◄─── Revokes all user's refresh tokens
└─────────────────┘
```

### Data Flow

1. **Login Flow**:
   - User authenticates via NextAuth (`/api/auth/signin`)
   - Client calls `POST /api/auth/token` to get refresh token
   - Refresh token stored in httpOnly cookie (or secure storage)
   - Access token used for API requests

2. **Refresh Flow**:
   - Access token expires (15 minutes)
   - Client detects 401 response
   - Client calls `POST /api/auth/refresh` with refresh token
   - Server validates and rotates refresh token
   - Returns new access token + new refresh token
   - Old refresh token is revoked

3. **Logout Flow**:
   - Client calls `POST /api/auth/logout`
   - All refresh tokens for user are revoked
   - Client clears tokens

---

## Security Features

### 1. Token Rotation

**What**: Every time a refresh token is used, it's replaced with a new one.

**Why**: Detects token theft. If an old token is reused, it indicates someone has a copy.

**How**:
- Old token is marked as `revoked` in database
- New token is generated in the same "token family"
- If revoked token is reused → entire family is revoked

### 2. Token Families

**What**: A UUID that groups related tokens together.

**Why**: Enables theft detection across token rotations.

**How**:
- Family ID created on initial token generation
- Preserved through rotations
- All tokens in family revoked when theft detected

### 3. Cryptographic Security

**What**: Tokens are generated using `crypto.randomBytes(64)` and hashed with SHA-256.

**Why**:
- Unpredictable tokens (128 hex characters)
- Stored as hashes (if database compromised, tokens are useless)
- One-way hashing (cannot reverse engineer tokens)

**How**:
```typescript
// Generate token
const rawToken = crypto.randomBytes(64).toString('hex')

// Hash for storage
const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')

// Store hash in DB
await prisma.refreshToken.create({ data: { token: hashedToken } })

// Return raw token to client (only time it's available unhashed)
return { token: rawToken }
```

### 4. Theft Detection

**What**: Automatic detection when someone tries to reuse an old token.

**When Triggered**:
- Old refresh token is used after rotation
- Indicates someone has a copy of the token

**Response**:
1. Revoke entire token family immediately
2. Log CRITICAL security event
3. Return 401 with security message
4. User must re-authenticate

**Code Flow**:
```typescript
// validateRefreshToken() checks if token is revoked
if (tokenRecord.isRevoked) {
  // THEFT DETECTED!
  await revokeTokenFamily(tokenRecord.tokenFamily, 'token_theft')
  await logSecurityEvent({
    severity: 'CRITICAL',
    eventType: 'SUSPICIOUS_ACTIVITY',
    description: 'Token theft detected'
  })
  return { valid: false, reason: 'theft_detected' }
}
```

### 5. Automatic Cleanup

**What**: Periodic removal of expired and old revoked tokens.

**When**: Should be run daily via cron job.

**How**:
```typescript
// In a cron job or scheduled task
await cleanupExpiredTokens() // Removes tokens expired >30 days ago
```

### 6. Rate Limiting

**Note**: Refresh endpoint should be rate limited (e.g., 10 requests per 15 minutes per user).

---

## API Endpoints

### POST /api/auth/token

**Purpose**: Generate a refresh token after successful NextAuth login.

**Authentication**: Requires valid NextAuth session.

**Request**: None (reads session from NextAuth).

**Response** (200):
```json
{
  "refreshToken": "abc123...xyz789", // 128 character hex string
  "expiresAt": "2025-01-22T10:30:00.000Z", // ISO 8601 timestamp
  "message": "Refresh token created successfully"
}
```

**Errors**:
- `401`: Not authenticated (no NextAuth session)
- `500`: Server error

**Usage**:
```typescript
// After successful NextAuth sign-in
const response = await fetch('/api/auth/token', { method: 'POST' })
const { refreshToken, expiresAt } = await response.json()

// Store refresh token securely (httpOnly cookie recommended)
document.cookie = `refreshToken=${refreshToken}; Secure; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`
```

---

### POST /api/auth/refresh

**Purpose**: Refresh an expired access token using a valid refresh token.

**Authentication**: None (uses refresh token in body).

**Request Body**:
```json
{
  "refreshToken": "abc123...xyz789"
}
```

**Response** (200):
```json
{
  "accessToken": "eyJhbGc...", // New JWT access token (15 min expiry)
  "refreshToken": "def456...uvw012", // New refresh token (rotated)
  "expiresAt": "2025-01-22T10:30:00.000Z", // New refresh token expiry
  "message": "Token refreshed successfully"
}
```

**Errors**:
- `400`: Missing or invalid refresh token in body
- `401`: Token expired, revoked, or theft detected
- `500`: Server error

**Theft Detection Response** (401):
```json
{
  "error": "Invalid refresh token",
  "message": "Your session has been terminated for security reasons. Please sign in again."
}
```

**Usage**:
```typescript
// When access token expires
const response = await fetch('/api/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken: getStoredRefreshToken() })
})

if (response.status === 401) {
  // Token invalid or theft detected - redirect to login
  window.location.href = '/auth/signin'
  return
}

const { accessToken, refreshToken: newRefreshToken } = await response.json()

// Update stored tokens
storeAccessToken(accessToken)
storeRefreshToken(newRefreshToken)
```

---

### POST /api/auth/logout

**Purpose**: Logout user and revoke all refresh tokens.

**Authentication**: Requires valid NextAuth session.

**Request**: None (reads session from NextAuth).

**Response** (200):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Side Effects**:
- All user's refresh tokens are revoked
- Session tracking data is cleared
- Audit log entry created

**Errors**:
- `401`: Not authenticated
- `500`: Server error

**Usage**:
```typescript
// Logout
await fetch('/api/auth/logout', { method: 'POST' })

// Clear client-side tokens
clearTokens()

// Redirect to signin
window.location.href = '/auth/signin'
```

---

## Client Integration

### Recommended Token Storage

**Refresh Token**: httpOnly cookie (most secure)
```typescript
// Server sets cookie in response
res.setHeader('Set-Cookie', `refreshToken=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${7*24*60*60}`)
```

**Access Token**: Memory or secure cookie (short-lived)
```typescript
// In-memory storage (lost on page refresh, but refreshable)
let accessToken: string | null = null

export function setAccessToken(token: string) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}
```

### Automatic Refresh Logic

```typescript
// API client wrapper
async function authenticatedFetch(url: string, options: RequestInit = {}) {
  // Add access token to request
  const accessToken = getAccessToken()
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${accessToken}`
  }

  // Make request
  let response = await fetch(url, { ...options, headers })

  // If 401 (unauthorized), try to refresh
  if (response.status === 401) {
    const refreshed = await refreshAccessToken()

    if (!refreshed) {
      // Refresh failed - redirect to login
      window.location.href = '/auth/signin'
      throw new Error('Session expired')
    }

    // Retry original request with new token
    headers.Authorization = `Bearer ${getAccessToken()}`
    response = await fetch(url, { ...options, headers })
  }

  return response
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = getRefreshToken() // From cookie or storage

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    })

    if (!response.ok) {
      return false
    }

    const { accessToken, refreshToken: newRefreshToken } = await response.json()

    setAccessToken(accessToken)
    setRefreshToken(newRefreshToken)

    return true
  } catch (error) {
    console.error('Token refresh failed:', error)
    return false
  }
}
```

### React Hook Example

```typescript
// hooks/useAuthRefresh.ts
import { useEffect, useCallback } from 'react'

export function useAuthRefresh() {
  const refreshToken = useCallback(async () => {
    const refreshToken = getRefreshToken()

    if (!refreshToken) return false

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      })

      if (!response.ok) {
        // Refresh failed - clear tokens and redirect
        clearTokens()
        window.location.href = '/auth/signin?session_expired=true'
        return false
      }

      const { accessToken, refreshToken: newRefreshToken } = await response.json()

      setAccessToken(accessToken)
      setRefreshToken(newRefreshToken)

      return true
    } catch (error) {
      console.error('Token refresh error:', error)
      return false
    }
  }, [])

  // Auto-refresh before access token expires (e.g., every 14 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshToken()
    }, 14 * 60 * 1000) // 14 minutes

    return () => clearInterval(interval)
  }, [refreshToken])

  return { refreshToken }
}
```

---

## Token Lifecycle

### Creation

1. User logs in via NextAuth
2. Client calls `POST /api/auth/token`
3. Server generates:
   - Random token (64 bytes → 128 hex chars)
   - Token family UUID
   - Expiration timestamp (7 days from now)
4. Token is hashed (SHA-256) and stored in database
5. Raw token returned to client (only time it's unhashed)

### Usage

1. Client stores refresh token securely
2. When access token expires, client calls `POST /api/auth/refresh`
3. Server validates refresh token:
   - Hash incoming token
   - Look up in database
   - Check if revoked (theft detection)
   - Check if expired
4. If valid, rotate token:
   - Mark old token as revoked
   - Generate new token in same family
   - Return new access + refresh tokens

### Expiration

- **Automatic**: Token expires 7 days after creation
- **Manual**: User logs out → all tokens revoked
- **Security**: Password change → all tokens revoked
- **Theft**: Reuse of revoked token → entire family revoked

### Cleanup

- Expired tokens remain in database for audit purposes
- Cleanup job removes tokens expired >30 days ago
- Revoked tokens kept for 30 days before deletion

---

## Theft Detection

### How It Works

Refresh tokens implement a "token rotation" security pattern:

1. **Normal Flow**:
   ```
   Login → Token A (family: fam1)
   Use Token A → Revoke A, Issue Token B (family: fam1)
   Use Token B → Revoke B, Issue Token C (family: fam1)
   ```

2. **Theft Detected**:
   ```
   Login → Token A (family: fam1)
   Use Token A → Revoke A, Issue Token B (family: fam1)

   [Attacker uses stolen Token A again]
   Server sees: Token A is REVOKED
   Response: REVOKE ENTIRE FAMILY (A, B, C...)
   ```

### Detection Logic

```typescript
// In validateRefreshToken()
if (tokenRecord.isRevoked) {
  // Token was already used and rotated
  // Someone is trying to reuse an old token → THEFT!

  await revokeTokenFamily(tokenRecord.tokenFamily, 'token_theft')

  await logSecurityEvent({
    severity: 'CRITICAL',
    eventType: 'SUSPICIOUS_ACTIVITY',
    description: 'Attempted reuse of revoked refresh token',
    userId: tokenRecord.userId,
    metadata: {
      tokenId: tokenRecord.id,
      tokenFamily: tokenRecord.tokenFamily,
      revokedAt: tokenRecord.revokedAt
    }
  })

  return { valid: false, reason: 'theft_detected' }
}
```

### Response to Theft

1. **Immediate Actions**:
   - Revoke all tokens in the family
   - Log CRITICAL security event
   - Return 401 to client with security message

2. **Recommended Additional Actions**:
   - Send email to user about suspicious activity
   - Log IP addresses and user agents
   - Consider forcing password reset
   - Review audit logs for user

3. **User Experience**:
   - User is logged out on all devices
   - Must re-authenticate to continue
   - Should see security warning message

---

## Configuration

### Environment Variables

```bash
# In .env
NEXTAUTH_SECRET=your-secret-at-least-32-chars  # Used for JWT signing
JWT_SECRET=your-jwt-secret                      # Alternative to NEXTAUTH_SECRET
```

### Token Settings

```typescript
// src/lib/refresh-token.ts
export const REFRESH_TOKEN_CONFIG = {
  // Refresh token lifetime: 7 days (in milliseconds)
  EXPIRATION_MS: 7 * 24 * 60 * 60 * 1000,

  // Maximum refresh tokens per user (prevents accumulation)
  MAX_TOKENS_PER_USER: 5,

  // Token length in bytes (will be hex encoded, so 64 bytes = 128 char string)
  TOKEN_LENGTH_BYTES: 64,
} as const
```

### Access Token Settings

```typescript
// src/lib/jwt-utils.ts
const JWT_ACCESS_TOKEN_EXPIRATION = '15m' // 15 minutes
```

### Customization

To change token lifetimes:

```typescript
// Longer refresh tokens (14 days)
EXPIRATION_MS: 14 * 24 * 60 * 60 * 1000

// Shorter access tokens (5 minutes)
const JWT_ACCESS_TOKEN_EXPIRATION = '5m'
```

**Security Note**: Shorter access tokens = better security, but more frequent refreshes.

---

## Database Schema

### RefreshToken Model

```prisma
model RefreshToken {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token           String   @unique // Hashed refresh token
  tokenFamily     String   // Family identifier for rotation detection
  expiresAt       DateTime // Refresh token expiration (7 days)
  isRevoked       Boolean  @default(false)
  revokedAt       DateTime?
  revokedReason   String? // "logout", "password_change", "token_theft", "manual_revocation"
  ipAddress       String?
  userAgent       String?
  createdAt       DateTime @default(now())
  lastUsedAt      DateTime @default(now())

  @@index([userId, isRevoked])
  @@index([tokenFamily, isRevoked])
  @@index([expiresAt])
}
```

### Indexes

- **`userId, isRevoked`**: Fast lookups for user's active tokens
- **`tokenFamily, isRevoked`**: Fast family revocation
- **`expiresAt`**: Efficient cleanup of expired tokens

### Cascade Deletion

When a user is deleted, all their refresh tokens are automatically deleted (`onDelete: Cascade`).

---

## Security Considerations

### ✅ DO

1. **Store refresh tokens in httpOnly cookies**
   - Prevents XSS attacks
   - Automatically sent with requests
   - Cannot be accessed by JavaScript

2. **Use HTTPS in production**
   - Prevents token interception
   - Required for Secure cookie flag

3. **Set short access token lifetimes**
   - 15 minutes is recommended
   - Limits damage if token is stolen

4. **Monitor security events**
   - Review CRITICAL events daily
   - Alert on theft detection
   - Track failed refresh attempts

5. **Revoke tokens on password change**
   ```typescript
   // In password change handler
   await revokeAllUserTokens(userId, 'password_change')
   ```

6. **Implement rate limiting**
   - Limit refresh endpoint (e.g., 10 per 15 min)
   - Prevents brute force attacks

7. **Run cleanup job regularly**
   ```bash
   # Daily cron job
   0 2 * * * curl -X POST https://yourapp.com/api/cron/cleanup-tokens
   ```

### ❌ DON'T

1. **Don't store refresh tokens in localStorage**
   - Vulnerable to XSS attacks
   - Use httpOnly cookies instead

2. **Don't log raw tokens**
   - Only log token IDs
   - Raw tokens are secrets

3. **Don't use predictable tokens**
   - Always use crypto.randomBytes()
   - Never use timestamps or counters

4. **Don't skip token rotation**
   - Rotation is critical for theft detection
   - Always rotate on refresh

5. **Don't ignore theft detection events**
   - CRITICAL events require investigation
   - May indicate account compromise

6. **Don't use long access token lifetimes**
   - 15 minutes max recommended
   - Longer = bigger security window if stolen

7. **Don't share refresh tokens between devices**
   - Each device should have its own token
   - Enables per-device revocation

---

## Testing

### Manual Testing

#### 1. Token Generation

```bash
# Login via NextAuth first (browser or Postman)
# Then generate refresh token

curl -X POST http://localhost:3000/api/auth/token \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"

# Expected response:
# {
#   "refreshToken": "abc123...",
#   "expiresAt": "2025-01-22T10:30:00.000Z",
#   "message": "Refresh token created successfully"
# }
```

#### 2. Token Refresh

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'

# Expected response:
# {
#   "accessToken": "eyJhbGc...",
#   "refreshToken": "def456...",  # NEW token (rotated)
#   "expiresAt": "2025-01-22T10:30:00.000Z",
#   "message": "Token refreshed successfully"
# }
```

#### 3. Theft Detection

```bash
# 1. Get refresh token
TOKEN1=$(curl -X POST .../api/auth/token | jq -r .refreshToken)

# 2. Use it once (rotates to TOKEN2)
TOKEN2=$(curl -X POST .../api/auth/refresh -d "{\"refreshToken\":\"$TOKEN1\"}" | jq -r .refreshToken)

# 3. Try to use TOKEN1 again (should detect theft)
curl -X POST .../api/auth/refresh -d "{\"refreshToken\":\"$TOKEN1\"}"

# Expected response (401):
# {
#   "error": "Invalid refresh token",
#   "message": "Your session has been terminated for security reasons. Please sign in again."
# }
```

#### 4. Token Expiration

```bash
# Wait 7 days or manually set expiresAt in DB to past

curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "EXPIRED_TOKEN"}'

# Expected response (401):
# {
#   "error": "Refresh token expired",
#   "message": "Your session has expired. Please sign in again."
# }
```

#### 5. Logout

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"

# Expected response:
# {
#   "success": true,
#   "message": "Logged out successfully"
# }

# Try to use refresh token after logout (should fail)
curl -X POST .../api/auth/refresh -d "{\"refreshToken\":\"$TOKEN\"}"
# Expected: 401 (token revoked)
```

### Automated Testing

```typescript
// tests/refresh-token.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createRefreshToken, validateRefreshToken, rotateRefreshToken } from '@/lib/refresh-token'

describe('Refresh Token System', () => {
  let userId: string
  let token: string

  beforeEach(async () => {
    userId = 'test-user-123'
  })

  it('should create a valid refresh token', async () => {
    const result = await createRefreshToken(userId)

    expect(result.token).toHaveLength(128) // 64 bytes hex = 128 chars
    expect(result.userId).toBe(userId)
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now())
  })

  it('should validate a valid token', async () => {
    const result = await createRefreshToken(userId)
    const validation = await validateRefreshToken(result.token)

    expect(validation.valid).toBe(true)
    expect(validation.userId).toBe(userId)
  })

  it('should rotate token successfully', async () => {
    const token1 = await createRefreshToken(userId)
    const token2 = await rotateRefreshToken(token1.token)

    expect(token2).not.toBeNull()
    expect(token2!.token).not.toBe(token1.token)
    expect(token2!.tokenFamily).toBe(token1.tokenFamily) // Same family
  })

  it('should detect token theft', async () => {
    const token1 = await createRefreshToken(userId)
    await rotateRefreshToken(token1.token) // Revokes token1

    // Try to use revoked token
    const validation = await validateRefreshToken(token1.token)

    expect(validation.valid).toBe(false)
    expect(validation.reason).toBe('theft_detected')
  })

  it('should reject expired token', async () => {
    const result = await createRefreshToken(userId)

    // Manually expire token in DB
    await prisma.refreshToken.update({
      where: { id: result.id },
      data: { expiresAt: new Date(Date.now() - 1000) }
    })

    const validation = await validateRefreshToken(result.token)

    expect(validation.valid).toBe(false)
    expect(validation.reason).toBe('expired')
  })
})
```

### Database Queries for Testing

```sql
-- View all refresh tokens for a user
SELECT
  id,
  LEFT(token, 16) || '...' as token_preview,
  token_family,
  expires_at,
  is_revoked,
  revoked_reason,
  created_at,
  last_used_at
FROM "RefreshToken"
WHERE user_id = 'USER_ID_HERE'
ORDER BY created_at DESC;

-- Check for theft detection events
SELECT
  id,
  event_type,
  severity,
  description,
  created_at
FROM "SecurityEvent"
WHERE event_type = 'SUSPICIOUS_ACTIVITY'
  AND description LIKE '%token theft%'
ORDER BY created_at DESC;

-- Count active vs revoked tokens
SELECT
  is_revoked,
  COUNT(*) as count,
  COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as not_expired
FROM "RefreshToken"
GROUP BY is_revoked;
```

---

## Troubleshooting

### Issue: "Token not found" error

**Symptoms**: 401 error with message "Invalid refresh token".

**Causes**:
1. Token was never created
2. Token was deleted (cleanup job)
3. Wrong token being sent

**Solutions**:
```sql
-- Check if token exists in DB
SELECT * FROM "RefreshToken"
WHERE token = 'HASHED_TOKEN_HERE';

-- Check user's tokens
SELECT * FROM "RefreshToken"
WHERE user_id = 'USER_ID_HERE'
ORDER BY created_at DESC;
```

---

### Issue: Constant "theft detected" errors

**Symptoms**: Users being logged out frequently with security messages.

**Causes**:
1. Client not updating refresh token after rotation
2. Multiple clients using same token
3. Race condition in token refresh

**Solutions**:
```typescript
// Ensure client stores NEW refresh token after refresh
const { refreshToken: newToken } = await response.json()
setRefreshToken(newToken) // CRITICAL: Use new token, not old one

// Add mutex to prevent concurrent refreshes
let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise // Wait for existing refresh
  }

  refreshPromise = doRefresh()
  const result = await refreshPromise
  refreshPromise = null

  return result
}
```

---

### Issue: Tokens expiring too quickly

**Symptoms**: Users being logged out within minutes.

**Causes**:
1. Wrong expiration configuration
2. System clock skew
3. Token being deleted prematurely

**Solutions**:
```typescript
// Check configuration
console.log('Refresh token lifetime:', REFRESH_TOKEN_CONFIG.EXPIRATION_MS)
// Should be: 604800000 (7 days in milliseconds)

// Check token expiration in DB
SELECT id, expires_at, created_at,
       EXTRACT(EPOCH FROM (expires_at - created_at))/3600 as hours_valid
FROM "RefreshToken"
ORDER BY created_at DESC LIMIT 10;
```

---

### Issue: Cleanup job deleting active tokens

**Symptoms**: Active tokens disappearing from database.

**Causes**:
1. Cleanup job running too aggressively
2. Wrong date calculation

**Solutions**:
```typescript
// Review cleanup logic
export async function cleanupExpiredTokens(): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const result = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } }, // Only expired tokens
        {
          isRevoked: true,
          revokedAt: { lt: thirtyDaysAgo }, // Revoked >30 days ago
        },
      ],
    },
  })

  return result.count
}

// Add logging to cleanup job
console.log(`Cleanup deleted ${count} tokens`)
```

---

### Issue: High memory usage from tokens

**Symptoms**: Database growing large with refresh tokens.

**Causes**:
1. Cleanup job not running
2. MAX_TOKENS_PER_USER too high
3. Many inactive users with tokens

**Solutions**:
```typescript
// Reduce max tokens per user
MAX_TOKENS_PER_USER: 3 // Instead of 5

// Run cleanup more frequently
// Daily cron job:
0 2 * * * /usr/bin/curl -X POST https://yourapp.com/api/cron/cleanup

// Manual cleanup
await cleanupExpiredTokens()
```

---

## Best Practices

### 1. Token Storage

**Client-Side**:
- ✅ httpOnly cookies (best)
- ✅ Secure memory storage (acceptable)
- ❌ localStorage (vulnerable to XSS)
- ❌ sessionStorage (vulnerable to XSS)

### 2. Token Rotation

- Always rotate tokens on refresh
- Never skip rotation "for convenience"
- Rotation is critical for theft detection

### 3. Monitoring

Set up alerts for:
- CRITICAL security events (theft detection)
- High rate of failed refresh attempts
- Unusual token creation patterns
- Mass token revocations

### 4. Audit Logging

Log all token operations:
- Creation (with IP, user agent)
- Rotation (with token IDs)
- Revocation (with reason)
- Theft detection events

### 5. User Communication

On security events:
- Send email notifications
- Display in-app security alerts
- Provide clear next steps
- Don't alarm unnecessarily

### 6. Token Lifetimes

Recommended:
- Access tokens: 15 minutes
- Refresh tokens: 7 days
- Cleanup retention: 30 days

### 7. Per-Device Tokens

- Issue separate tokens per device/browser
- Enable "View active sessions" UI
- Allow per-device revocation

### 8. Regular Security Reviews

- Monthly: Review security event logs
- Quarterly: Audit token configuration
- Yearly: Penetration testing
- Always: Stay updated on security best practices

---

## Summary

The refresh token system provides:

✅ **Security**:
- Token rotation with theft detection
- Cryptographically secure tokens
- Comprehensive audit logging
- Automatic cleanup

✅ **User Experience**:
- Long-lived sessions (7 days)
- Seamless token refresh
- Per-device session management

✅ **Developer Experience**:
- Simple API endpoints
- Clear error messages
- TypeScript support
- Comprehensive documentation

For additional help, refer to:
- `src/lib/refresh-token.ts` - Token management library
- `src/app/api/auth/refresh/route.ts` - Refresh endpoint
- `src/app/api/auth/token/route.ts` - Token generation endpoint
- Security event logs in database

---

**Last Updated**: 2026-01-15
**Version**: 1.0.0
**Status**: Production Ready
