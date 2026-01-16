# SmartBudget Production Deployment Guide

This guide provides comprehensive instructions for deploying SmartBudget to production on Vercel with PostgreSQL database hosting.

## Table of Contents

- [Version 2.0 Deployment Notes](#version-20-deployment-notes)
- [Prerequisites](#prerequisites)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Environment Setup](#environment-setup)
- [Redis Configuration](#redis-configuration)
- [Database Setup](#database-setup)
- [User Role Management (RBAC)](#user-role-management-rbac)
- [Vercel Deployment](#vercel-deployment)
- [Domain and SSL Configuration](#domain-and-ssl-configuration)
- [Environment Variables](#environment-variables)
- [Database Migrations](#database-migrations)
- [Error Monitoring](#error-monitoring)
- [Performance Optimization](#performance-optimization)
- [Security Configuration](#security-configuration)
- [Post-Deployment Verification](#post-deployment-verification)
- [Monitoring and Alerting](#monitoring-and-alerting)
- [Backup and Recovery](#backup-and-recovery)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)

---

## Version 2.0 Deployment Notes

SmartBudget Version 2.0 introduces significant improvements to performance, security, and scalability. Here are the key differences from v1.0 that require special attention during deployment:

### Key Changes

1. **Redis Integration (Optional but Recommended)**
   - Version 2.0 uses Redis for distributed caching and rate limiting
   - Optional: Works without Redis but with reduced performance and single-instance rate limiting
   - Recommended: Configure Redis (Upstash) for production deployments
   - Impact: 80-90% reduction in database load for cached requests

2. **Role-Based Access Control (RBAC)**
   - New user role system (USER, ADMIN) stored in database
   - Replaces environment variable-based admin list
   - All new users default to USER role
   - Admins must be manually promoted via database update

3. **Enhanced Security**
   - Comprehensive Zod validation on all 54 API endpoints
   - 4-tier rate limiting system (STRICT, EXPENSIVE, MODERATE, LENIENT)
   - Jobs API now requires ADMIN role
   - All security features are enabled by default

4. **Performance Improvements**
   - Code splitting reduces initial bundle by 130-160KB (gzipped)
   - Dashboard endpoints cached with 5-minute TTL
   - Single-pass database aggregation (92% reduction in processing)
   - Expected Lighthouse scores: >90 on all metrics

5. **Testing Requirements**
   - 260+ E2E tests covering all critical flows
   - Accessibility testing with Axe
   - Performance benchmarks with Lighthouse CI
   - Cross-browser testing (9 browser/device combinations)

### Migration Checklist

If upgrading from v1.0:

- [ ] Review and run new database migrations (adds `role` field to users)
- [ ] Consider adding Redis for optimal performance
- [ ] Update environment variables (add Redis config if using)
- [ ] Manually promote existing admin users to ADMIN role in database
- [ ] Run E2E test suite to verify all functionality
- [ ] Run performance benchmarks to establish baseline
- [ ] Review rate limiting configuration for your use case
- [ ] Test without Redis to ensure graceful fallback works

### Backward Compatibility

Version 2.0 maintains backward compatibility with v1.0 in the following ways:

- Existing user accounts continue to work (default to USER role)
- All API endpoints remain unchanged
- Database schema is additive (no breaking changes)
- Environment variables from v1.0 still work
- Redis is optional (graceful fallback to in-memory)

### Breaking Changes

The following changes may require action:

1. **Admin Access**: Existing admins listed in `ADMIN_EMAILS` environment variable need to be promoted to ADMIN role in database (see [User Role Management](#user-role-management-rbac))
2. **Rate Limiting**: New rate limits may affect high-volume usage patterns (see [Rate Limiting Dependencies](#rate-limiting-dependencies))
3. **Jobs API**: Now requires authentication and ADMIN role (was previously unprotected)

---

## Prerequisites

Before deploying to production, ensure you have:

- [x] **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
- [x] **GitHub Repository**: Code pushed to GitHub (recommended for automatic deployments)
- [x] **PostgreSQL Database**: Neon, Supabase, or other cloud PostgreSQL provider
- [x] **Redis Instance** (optional but recommended): Upstash Redis for caching and rate limiting
- [x] **Domain Name** (optional): Custom domain for production
- [x] **Anthropic API Key**: For Claude AI merchant lookup feature
- [x] **Sentry Account** (optional but recommended): For error monitoring
- [x] **Node.js 20+**: For local development and testing

---

## Pre-Deployment Checklist

Complete these steps before deploying to production:

### Code Quality

- [ ] All TypeScript compilation errors resolved (`npm run build`)
- [ ] All tests passing (`npm run test`)
- [ ] ESLint checks passing (`npm run lint`)
- [ ] No console.log statements in production code
- [ ] All TODO comments reviewed and addressed
- [ ] Code reviewed and approved

### Security

- [ ] All environment variables moved from `.env` to production secrets
- [ ] NEXTAUTH_SECRET generated with strong random value
- [ ] Database credentials secured
- [ ] API keys secured
- [ ] No hardcoded secrets in code
- [ ] CORS policy configured
- [ ] Rate limiting enabled (verify Redis config or in-memory fallback)
- [ ] Security headers configured
- [ ] Zod validation schemas active on all API endpoints
- [ ] RBAC system configured (admin users promoted)
- [ ] Jobs API restricted to ADMIN role

### Database

- [ ] Database schema finalized
- [ ] Migrations tested locally
- [ ] Production database created
- [ ] Database connection tested
- [ ] Seed data prepared
- [ ] Backup strategy in place

### Monitoring

- [ ] Sentry project created and configured
- [ ] Vercel Analytics enabled
- [ ] Error alerts configured
- [ ] Performance monitoring set up
- [ ] Logging strategy defined

### Documentation

- [ ] README.md updated
- [ ] API documentation current
- [ ] User guide current
- [ ] Deployment guide reviewed
- [ ] Environment variables documented
- [ ] Version 2.0 changes communicated to team

### Testing (Version 2.0)

- [ ] Unit tests passing (`npm run test`)
- [ ] Integration tests passing (`npm run test:integration`)
- [ ] E2E tests passing (`npm run test:e2e`)
- [ ] Accessibility tests passing (`npm run test:accessibility`)
- [ ] Performance benchmarks run (`npm run test:performance`)
- [ ] Cross-browser tests verified (`npm run test:cross-browser`)
- [ ] Expected Lighthouse scores achieved (>90 on all metrics)

---

## Redis Configuration

Redis is **optional but highly recommended** for production deployments. SmartBudget Version 2.0 uses Redis for two critical features:

1. **Distributed Caching**: Dashboard aggregations and ML embeddings (5-minute TTL)
2. **Rate Limiting**: Distributed rate limiting across multiple server instances

### Why Use Redis?

**With Redis (Recommended):**
- 80-90% reduction in database load for cached requests
- Dashboard loads in ~10-20ms (cached) vs ~50-100ms (uncached)
- Distributed rate limiting works across multiple Vercel serverless instances
- ML embeddings cached permanently (only regenerated on training)
- Better scalability for high-traffic deployments

**Without Redis (Fallback):**
- In-memory caching (single instance only)
- In-memory rate limiting (single instance only)
- Each server instance has separate cache (no sharing)
- Higher database load
- Still functional, but reduced performance

### Setting Up Upstash Redis (Recommended)

Upstash provides serverless Redis with a generous free tier, perfect for Vercel deployments.

1. **Create Upstash Account**:
   - Sign up at [upstash.com](https://upstash.com)
   - Navigate to Console

2. **Create Redis Database**:
   - Click "Create Database"
   - Name: `smartbudget-production`
   - Type: Regional (choose region closest to your Vercel deployment)
   - Primary Region: Select closest to users
   - Read Regions: Add if needed for global deployment
   - TLS: Enabled (default)
   - Eviction: No eviction (default)

3. **Get Connection Details**:
   - Click on your database
   - Scroll to "REST API" section
   - Copy `UPSTASH_REDIS_REST_URL`
   - Copy `UPSTASH_REDIS_REST_TOKEN`

4. **Add to Environment Variables**:
   ```bash
   UPSTASH_REDIS_REST_URL="https://your-database.upstash.io"
   UPSTASH_REDIS_REST_TOKEN="your-token-here"
   ```

### Redis Configuration Options

**Free Tier (Sufficient for most deployments):**
- 10,000 commands/day
- 256 MB storage
- TLS encryption
- Good for: Development, staging, small production (<1000 users)

**Pay-as-you-go (Recommended for production):**
- Unlimited commands
- Scalable storage
- Global replication
- Good for: Production deployments with >1000 users

### Verifying Redis Connection

Test Redis connection locally:

```bash
# Set environment variables
export UPSTASH_REDIS_REST_URL="https://your-database.upstash.io"
export UPSTASH_REDIS_REST_TOKEN="your-token-here"

# Start development server
npm run dev

# Check logs for "Redis connected" message
# If Redis fails, you'll see "Redis unavailable, using in-memory fallback"
```

### Fallback Behavior

SmartBudget gracefully handles Redis being unavailable:

1. **Cache Fallback**:
   - Attempts Redis connection
   - Falls back to in-memory cache if Redis unavailable
   - Logs warning: "Redis unavailable, using in-memory cache"
   - All functionality continues to work

2. **Rate Limiting Fallback**:
   - Attempts Redis-based rate limiting
   - Falls back to in-memory rate limiting if Redis unavailable
   - Single-instance only (not distributed)
   - Logs warning: "Using in-memory rate limiter (single-instance only)"

3. **No Breaking Changes**:
   - Application works without Redis
   - No code changes needed
   - Optional configuration only

### Performance Impact

**Dashboard Load Times (10k transactions):**

| Scenario | Database Queries | Load Time | Notes |
|----------|-----------------|-----------|-------|
| With Redis (cached) | 0 | ~10-20ms | Best performance |
| With Redis (cache miss) | 10+ | ~50-100ms | After optimization |
| Without Redis (in-memory) | 10+ | ~50-100ms | Per-instance cache |
| Without Redis (no cache) | 10+ | ~120-200ms | Original performance |

**Rate Limiting:**

| Scenario | Distribution | Notes |
|----------|-------------|-------|
| With Redis | Distributed | Counts shared across all instances |
| Without Redis | Per-instance | Each instance has separate limits |

### Redis Troubleshooting

See [Redis Troubleshooting](#redis-troubleshooting) section below for common issues and solutions.

---

## Rate Limiting Dependencies

SmartBudget Version 2.0 implements a comprehensive 4-tier rate limiting system to prevent abuse and protect server resources.

### Rate Limiting Tiers

| Tier | Use Case | Limit | Window | Endpoints |
|------|----------|-------|--------|-----------|
| **STRICT** | Authentication | 5 requests | 15 minutes | `/api/auth/signup`, `/api/auth/signin` |
| **EXPENSIVE** | Costly operations | 10 requests | 60 minutes | ML training, imports, categorization, merchant research |
| **MODERATE** | Standard API | 100 requests | 15 minutes | Exports, standard CRUD operations |
| **LENIENT** | Read operations | 300 requests | 15 minutes | GET requests, list operations |

### Protected Endpoints

**STRICT Tier (5 requests / 15 min):**
- Prevents brute force attacks on authentication
- Protects against credential stuffing
- Applied to signup and signin endpoints

**EXPENSIVE Tier (10 requests / hour):**
- `/api/ml/train` (POST, GET) - ML model training
- `/api/transactions/import` (POST) - Bulk transaction import
- `/api/transactions/categorize` (POST, PUT) - AI categorization
- `/api/merchants/research` (POST) - Claude AI merchant lookup

**MODERATE Tier (100 requests / 15 min):**
- `/api/transactions/export` (GET) - Transaction export
- Standard API operations

**LENIENT Tier (300 requests / 15 min):**
- Read-only operations
- List/view endpoints
- High-volume legitimate usage

### Rate Limiting Strategy

**User ID-Based (Preferred):**
- Authenticated requests use user ID for rate limiting
- More accurate than IP-based limiting
- Prevents proxy/VPN bypass
- Shared across all user's sessions

**IP-Based (Fallback):**
- Unauthenticated requests use IP address
- Less accurate (shared IPs, VPNs)
- Still provides basic protection

**Sliding Window Algorithm:**
- Prevents burst attacks
- Smoother rate limiting than fixed windows
- Example: 5 requests / 15 min = can't spam all 5 at once and wait

### Redis vs In-Memory Rate Limiting

**With Redis (Distributed):**
- Rate limits shared across all Vercel serverless instances
- Accurate counting even with many concurrent requests
- Recommended for production with multiple instances
- Prevents users from bypassing limits by hitting different instances

**Without Redis (In-Memory):**
- Each Vercel instance has separate rate limit counters
- User might get 5x limit if hitting 5 different instances
- Still provides protection but less accurate
- Acceptable for single-instance deployments or low traffic

### Configuration

Rate limits are configured in `src/lib/rate-limiter.ts`:

```typescript
export const RATE_LIMIT_TIERS = {
  STRICT: { requests: 5, window: '15 m' },      // Auth
  EXPENSIVE: { requests: 10, window: '1 h' },   // ML, import
  MODERATE: { requests: 100, window: '15 m' },  // Standard API
  LENIENT: { requests: 300, window: '15 m' },   // Read-only
}
```

**Adjusting Limits:**

If your use case requires different limits:

1. Edit `src/lib/rate-limiter.ts`
2. Update tier configurations
3. Redeploy application
4. Consider security implications

**Example:** High-traffic dashboard might need:
```typescript
LENIENT: { requests: 500, window: '15 m' }  // Increased from 300
```

### Rate Limit Headers

API responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642521600
```

**Headers:**
- `X-RateLimit-Limit`: Maximum requests allowed in window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

### Rate Limit Responses

**429 Too Many Requests:**
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again in 15 minutes.",
  "retryAfter": 900
}
```

**Retry-After Header:**
- Included in 429 responses
- Seconds until rate limit resets
- Clients should respect this header

### Testing Rate Limits

**Test Authentication Rate Limit:**
```bash
# Should block after 5 requests
for i in {1..10}; do
  curl -X POST https://your-domain.com/api/auth/signup \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test$i@example.com\",\"password\":\"Test123!\"}"
  echo ""
done
```

**Test ML Rate Limit:**
```bash
# Should block after 10 requests in 1 hour
for i in {1..15}; do
  curl -X POST https://your-domain.com/api/ml/train \
    -H "Cookie: next-auth.session-token=YOUR_SESSION"
  echo ""
done
```

### Monitoring Rate Limits

**Check Logs:**
```bash
# Vercel logs show rate limit violations
vercel logs YOUR_DEPLOYMENT_URL --follow

# Look for:
# "Rate limit exceeded: user123 on /api/ml/train"
```

**Sentry Monitoring:**
- Rate limit violations logged to Sentry
- Alert on high violation rates
- May indicate abuse or misconfigured limits

### Rate Limiting Best Practices

1. **Start Conservative**: Begin with stricter limits, relax if needed
2. **Monitor Usage**: Track rate limit hits to adjust limits
3. **Communicate Limits**: Document rate limits in API documentation
4. **Graceful Degradation**: UI should handle 429 responses gracefully
5. **Consider Tiers**: Different user tiers may need different limits (future)

### Common Rate Limiting Issues

**Legitimate Users Getting Blocked:**
- Review user behavior patterns
- Consider increasing limits for specific tiers
- Add user feedback mechanism for false positives

**Rate Limits Too Lenient:**
- Monitor for abuse patterns
- Decrease limits if seeing unusual activity
- Add additional tiers for more granular control

**Distributed Limiting Not Working:**
- Verify Redis is connected (check logs)
- Test hitting multiple Vercel instances
- Confirm `UPSTASH_REDIS_REST_URL` is set

### Future Enhancements

Potential improvements to rate limiting:

1. **User Tier-Based Limits**: Premium users get higher limits
2. **API Key System**: External integrations with separate limits
3. **Dynamic Limiting**: Adjust limits based on server load
4. **Whitelist**: Bypass rate limits for trusted IPs/users
5. **Detailed Analytics**: Dashboard showing rate limit usage

---

## Environment Setup

### 1. Create Production Environment Variables

Create a `.env.production` file (DO NOT commit to Git):

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# NextAuth.js
NEXTAUTH_SECRET="your-production-secret-here-generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-domain.com"

# Anthropic API (Claude AI)
ANTHROPIC_API_KEY="sk-ant-api03-your-production-key-here"

# Redis (Optional but Recommended - Version 2.0)
# For distributed caching and rate limiting
# If omitted, falls back to in-memory (single-instance only)
UPSTASH_REDIS_REST_URL="https://your-database.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token-here"

# Sentry Error Monitoring
SENTRY_DSN="https://your-sentry-dsn-here"
NEXT_PUBLIC_SENTRY_DSN="https://your-public-sentry-dsn-here"
SENTRY_ORG="your-organization"
SENTRY_PROJECT="smartbudget"
SENTRY_AUTH_TOKEN="your-auth-token-for-source-maps"

# Optional: OAuth Providers (if enabled)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 2. Generate Secrets

Generate a secure NEXTAUTH_SECRET:

```bash
openssl rand -base64 32
```

---

## Database Setup

### Option 1: Neon PostgreSQL (Recommended)

1. **Create Account**: Sign up at [neon.tech](https://neon.tech)

2. **Create Project**:
   - Project name: SmartBudget Production
   - Region: Choose closest to your users
   - PostgreSQL version: 16+

3. **Get Connection String**:
   - Copy the connection string from Neon dashboard
   - Format: `postgresql://user:password@host/database?sslmode=require`

4. **Configure Connection Pooling** (recommended):
   - Enable connection pooling in Neon
   - Use pooled connection string for Prisma

### Option 2: Supabase PostgreSQL

1. **Create Account**: Sign up at [supabase.com](https://supabase.com)

2. **Create Project**:
   - Project name: SmartBudget
   - Database password: Strong password
   - Region: Choose closest to your users

3. **Get Connection String**:
   - Go to Settings → Database
   - Copy "Connection string" (transaction mode)
   - Replace `[YOUR-PASSWORD]` with your database password

4. **Enable Connection Pooling**:
   - Use "Connection pooling" string for better performance
   - Port 6543 (pooled) instead of 5432 (direct)

### Database Configuration

1. **Update DATABASE_URL** in Vercel environment variables

2. **Test Connection Locally**:
   ```bash
   npx prisma db push --skip-generate
   ```

3. **Run Migrations**:
   ```bash
   npx prisma migrate deploy
   ```

4. **Seed Database**:
   ```bash
   npm run db:seed
   ```

---

## User Role Management (RBAC)

SmartBudget Version 2.0 implements Role-Based Access Control (RBAC) stored in the database. This replaces the environment variable-based admin system from v1.0.

### User Roles

**USER** (Default):
- Can access all personal features
- Can manage own transactions, budgets, accounts
- Can use ML categorization and merchant research
- Cannot access admin features

**ADMIN**:
- All USER permissions
- Can access `/api/jobs/process` endpoint
- Can manually process background jobs
- Can view system-wide statistics (future feature)

### Default Role Assignment

All new user accounts automatically receive the `USER` role upon registration. This is the safest default and follows the principle of least privilege.

### Promoting Users to ADMIN

To grant admin privileges to a user, you need to manually update their role in the database.

#### Method 1: Using Prisma Studio (Recommended)

1. **Connect to Production Database**:
   ```bash
   # Set DATABASE_URL environment variable
   export DATABASE_URL="your-production-database-url"

   # Open Prisma Studio
   npx prisma studio
   ```

2. **Navigate to User Model**:
   - Click "User" in the left sidebar
   - Find the user you want to promote

3. **Update Role**:
   - Click on the user's row
   - Change `role` field from `USER` to `ADMIN`
   - Click "Save 1 change"

4. **Verify**:
   - Role change takes effect immediately
   - User can now access admin endpoints

#### Method 2: Using SQL

1. **Connect to Database**:
   ```bash
   psql $DATABASE_URL
   ```

2. **Promote User by Email**:
   ```sql
   UPDATE "User"
   SET role = 'ADMIN'
   WHERE email = 'admin@example.com';
   ```

3. **Verify**:
   ```sql
   SELECT id, email, role
   FROM "User"
   WHERE role = 'ADMIN';
   ```

#### Method 3: Using Database Provider UI

**Neon:**
1. Go to Neon Console → SQL Editor
2. Run: `UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@example.com';`

**Supabase:**
1. Go to Supabase Dashboard → Table Editor → User
2. Find user and edit `role` field to `ADMIN`

### Admin Operations

The following operations require ADMIN role in Version 2.0:

1. **Job Processing** (`POST /api/jobs/process`):
   - Manually triggers background job processing
   - Requires authentication + ADMIN role
   - Returns 403 Forbidden for non-admin users

2. **Future Admin Features**:
   - User management (planned)
   - System statistics (planned)
   - Audit logs (planned)

### Migrating from v1.0

If upgrading from v1.0 where admins were defined in `ADMIN_EMAILS` environment variable:

1. **Identify Current Admins**:
   ```bash
   # From .env or Vercel environment variables
   echo $ADMIN_EMAILS
   # Example: "admin1@example.com,admin2@example.com"
   ```

2. **Promote Each Admin**:
   ```sql
   -- Run for each admin email
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin1@example.com';
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin2@example.com';
   ```

3. **Verify Migration**:
   ```sql
   SELECT email, role FROM "User" WHERE role = 'ADMIN';
   ```

4. **Optional - Remove ADMIN_EMAILS**:
   - The environment variable is no longer used
   - You can remove it from Vercel environment variables
   - Kept as fallback in code for transition period

### Security Considerations

1. **Audit Admin Access**:
   - Regularly review who has ADMIN role
   - Remove ADMIN role from users who no longer need it
   - Log admin operations (future enhancement)

2. **Principle of Least Privilege**:
   - Only grant ADMIN role to trusted users
   - Most users should remain USER role
   - Consider creating more granular roles in future

3. **Role Changes**:
   - Take effect immediately (no server restart needed)
   - User must re-authenticate to pick up role change
   - Session token includes role information

### Troubleshooting RBAC

**Issue: User promoted to ADMIN but still gets 403 Forbidden**

Solution:
1. Clear browser cookies and re-login
2. Check database: `SELECT email, role FROM "User" WHERE email = 'user@example.com';`
3. Check API middleware is using database role check (not ADMIN_EMAILS)

**Issue: Cannot promote user - user doesn't exist**

Solution:
1. User must register first to create account
2. Check user exists: `SELECT email FROM "User" WHERE email = 'user@example.com';`
3. Verify email is correct (case-sensitive)

**Issue: All users getting ADMIN access**

Solution:
1. Check database migration applied correctly
2. Verify default role is USER: `SELECT role FROM "User" ORDER BY "createdAt" DESC LIMIT 5;`
3. If issue persists, check `api-middleware.ts` for bugs

---

## Vercel Deployment

### Method 1: GitHub Integration (Recommended)

1. **Push Code to GitHub**:
   ```bash
   git push origin main
   ```

2. **Import Project to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select your GitHub repository
   - Framework Preset: Next.js
   - Root Directory: ./
   - Click "Deploy"

3. **Automatic Deployments**:
   - Every push to `main` branch triggers production deployment
   - Pull requests create preview deployments

### Method 2: Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

### Deployment Configuration

Vercel will automatically detect Next.js and configure:
- Build command: `npm run build`
- Output directory: `.next`
- Install command: `npm install`
- Development command: `npm run dev`

---

## Domain and SSL Configuration

### 1. Add Custom Domain

1. **Go to Project Settings** → Domains
2. **Add Domain**: Enter your domain (e.g., `smartbudget.com`)
3. **Configure DNS**:

   **Option A: Vercel Nameservers (Easiest)**
   - Point your domain's nameservers to Vercel
   - NS1: `ns1.vercel-dns.com`
   - NS2: `ns2.vercel-dns.com`

   **Option B: CNAME Record**
   - Add CNAME record: `cname.vercel-dns.com`
   - Example: `www` → `cname.vercel-dns.com`

   **Option C: A Record**
   - Add A record: `76.76.21.21`

4. **Wait for DNS Propagation** (5-60 minutes)
5. **SSL Certificate**: Automatically provisioned by Vercel

### 2. Update Environment Variables

Update `NEXTAUTH_URL` to your production domain:

```bash
NEXTAUTH_URL="https://smartbudget.com"
```

### 3. Configure Redirects (Optional)

Add to `vercel.json`:

```json
{
  "redirects": [
    {
      "source": "/:path((?!www).*)",
      "destination": "https://www.smartbudget.com/:path*",
      "permanent": true
    }
  ]
}
```

---

## Environment Variables

### Configure in Vercel Dashboard

1. **Go to Project Settings** → Environment Variables

2. **Add All Required Variables**:

| Variable | Value | Environment | Notes |
|----------|-------|-------------|-------|
| `DATABASE_URL` | PostgreSQL connection string | Production, Preview | Required |
| `NEXTAUTH_SECRET` | Random secret (32+ chars) | Production, Preview, Development | Required |
| `NEXTAUTH_URL` | `https://your-domain.com` | Production | Required |
| `ANTHROPIC_API_KEY` | Anthropic API key | Production, Preview | Required for ML features |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL | Production, Preview | Optional (v2.0) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token | Production, Preview | Optional (v2.0) |
| `SENTRY_DSN` | Sentry server DSN | Production, Preview | Optional |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry public DSN | Production, Preview | Optional |
| `SENTRY_ORG` | Sentry organization | Production, Preview | Optional |
| `SENTRY_PROJECT` | Sentry project | Production, Preview | Optional |
| `SENTRY_AUTH_TOKEN` | Sentry auth token | Production | Optional |

3. **Environment Scopes**:
   - **Production**: Live site
   - **Preview**: Branch deployments (PR previews)
   - **Development**: Local development (use `.env.local`)

### Secrets Management Best Practices

1. **Never commit secrets** to Git
2. **Use different secrets** for each environment
3. **Rotate secrets** regularly (every 90 days)
4. **Use strong random values** (minimum 32 characters)
5. **Limit access** to production secrets
6. **Use Vercel CLI** for bulk environment variable updates:
   ```bash
   vercel env add DATABASE_URL production
   ```

---

## Database Migrations

### Initial Deployment

1. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

2. **Run Migrations**:
   ```bash
   npx prisma migrate deploy
   ```

3. **Seed Database**:
   ```bash
   npm run db:seed
   ```

### Subsequent Deployments

#### Automatic Migration (Recommended)

Add build command in Vercel:

```json
{
  "buildCommand": "prisma migrate deploy && next build"
}
```

Or add to `package.json`:

```json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

#### Manual Migration

1. **Before Deployment**:
   ```bash
   npx prisma migrate deploy --preview-feature
   ```

2. **Verify Migration**:
   ```bash
   npx prisma db push --skip-generate
   ```

3. **Deploy Application**:
   ```bash
   vercel --prod
   ```

### Migration Best Practices

1. **Test migrations locally** before production
2. **Backup database** before migration
3. **Use transactions** for data migrations
4. **Plan for downtime** if necessary
5. **Have rollback plan** ready
6. **Monitor errors** during migration

### Rollback Migration

If a migration fails:

```bash
# Restore database from backup
# OR revert schema changes
npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

---

## Error Monitoring

### Sentry Setup

1. **Create Sentry Project**:
   - Sign up at [sentry.io](https://sentry.io)
   - Create new project (Next.js)
   - Copy DSN (Data Source Name)

2. **Configure Environment Variables** (see above)

3. **Source Maps Upload** (Optional but Recommended):

   Add to `package.json`:
   ```json
   {
     "scripts": {
       "build": "next build",
       "sentry:sourcemaps": "sentry-cli sourcemaps upload --org=YOUR_ORG --project=YOUR_PROJECT .next"
     }
   }
   ```

4. **Configure Alerts**:
   - Go to Sentry → Alerts
   - Create alert for critical errors
   - Set up Slack/email notifications

### Monitoring Checklist

- [x] Sentry configured and tested
- [x] Error alerts set up
- [x] Performance monitoring enabled
- [x] User feedback widget enabled (optional)
- [x] Release tracking configured

---

## Performance Optimization

SmartBudget Version 2.0 includes significant performance improvements out of the box. This section documents what's already implemented and expected performance targets.

### 1. Redis Caching (Version 2.0)

**Dashboard Aggregations** (5-minute TTL):
- `/api/dashboard/overview` - User spending overview
- `/api/dashboard/spending-trends` - Trend analysis
- `/api/dashboard/category-breakdown` - Category distribution
- `/api/dashboard/category-heatmap` - Heatmap data
- `/api/dashboard/cash-flow-sankey` - Cash flow visualization

**ML Embeddings** (Permanent cache, invalidated on training):
- Pre-computed embeddings for category classification
- Training data cached globally
- Shared across all users

**Cache Invalidation**:
- Automatic on transaction create/update/delete
- Automatic on ML model retraining
- Pattern-based invalidation with wildcards

**Performance Impact**:
- With Redis (cached): ~10-20ms response time, 0 database queries
- With Redis (cache miss): ~50-100ms response time, 10+ queries
- Without Redis: ~50-100ms per instance (in-memory cache)
- Original (v1.0): ~120-200ms response time

### 2. Code Splitting (Version 2.0)

**Lazy Loaded Components**:
- Recharts library (~80-100KB gzipped) - Loaded on demand for dashboard charts
- D3 library (~30-50KB gzipped) - Loaded for Sankey diagrams and heatmaps
- Budget analytics (~10KB) - Loaded when navigating to analytics page

**Impact**:
- Initial bundle reduced by 130-160KB (gzipped)
- Charts load on-demand when user scrolls to them
- Suspense boundaries with skeleton loaders for smooth UX

### 3. Database Optimization (Version 2.0)

**Single-Pass Aggregation**:
- Eliminated redundant date filtering loops
- Map-based aggregation for efficiency
- 92% reduction in processing operations (10k transactions: ~120k → ~10k ops)

**Indexes** (already configured in schema.prisma):
```prisma
@@index([userId, date])
@@index([accountId, date])
@@index([merchantName])
@@index([role]) // New in v2.0
```

**Connection Pooling**:
- Use Prisma connection pooling
- Set connection limits in DATABASE_URL:
  ```
  DATABASE_URL="postgresql://...?connection_limit=10&pool_timeout=10"
  ```

### 4. Loading States (Version 2.0)

**Skeleton Loaders**:
- Dashboard page with full skeleton structure
- Transactions page with table skeleton
- Budgets page with card skeletons
- Accounts page with list skeletons
- Reduces perceived loading time and improves CLS

### 5. Image Optimization

Already configured:
- Next.js Image component
- AVIF/WebP formats
- Responsive images

### 6. Bundle Size Optimization

Monitor bundle size:
```bash
npm run build
# Analyze output
# Look for route segment sizes in build output
```

**Expected Bundle Sizes** (v2.0):
- First Load JS: ~90-110KB (down from ~200KB in v1.0)
- Shared chunks: ~80KB
- Route-specific: ~10-30KB per route

### 7. Vercel Analytics

Enable in Vercel Dashboard:
- Project Settings → Analytics
- Web Analytics (free)
- Speed Insights (free)

### Expected Performance Targets (Version 2.0)

Run performance benchmarks after deployment to verify these targets:

```bash
npm run test:performance
```

**Lighthouse Scores** (Target: >90 on all metrics):

| Page | Performance | Accessibility | Best Practices | SEO | Notes |
|------|-------------|---------------|----------------|-----|-------|
| Homepage | >90 | >95 | >90 | >90 | Static, fast |
| Dashboard | >90 | >95 | >90 | >90 | With Redis cache |
| Dashboard (no cache) | >85 | >95 | >90 | >90 | First load |
| Transactions | >90 | >95 | >90 | >90 | With pagination |
| Budgets | >90 | >95 | >90 | >90 | List view |
| Accounts | >90 | >95 | >90 | >90 | List view |

**Core Web Vitals**:

| Metric | Target | Description |
|--------|--------|-------------|
| FCP (First Contentful Paint) | <1.5s | Time to first visible content |
| LCP (Largest Contentful Paint) | <2.5s | Time to main content loaded |
| TTI (Time to Interactive) | <3.0s | Time until page is fully interactive |
| CLS (Cumulative Layout Shift) | <0.1 | Layout stability score |
| TBT (Total Blocking Time) | <200ms | Main thread blocking time |

**API Response Times**:

| Endpoint Type | Target | Notes |
|---------------|--------|-------|
| Dashboard (cached) | <20ms | With Redis |
| Dashboard (uncached) | <100ms | After query optimization |
| Transaction CRUD | <50ms | Simple queries |
| ML Categorization | <200ms | With cached embeddings |
| Import (100 transactions) | <2s | Bulk operation |

### Performance with vs without Redis

**Dashboard Load (10,000 transactions):**

| Configuration | Database Queries | Response Time | Cache Hit Rate |
|---------------|-----------------|---------------|----------------|
| Redis + Cache Hit | 0 | ~10-20ms | 80-90% (5min window) |
| Redis + Cache Miss | 10+ | ~50-100ms | 10-20% |
| In-Memory (per instance) | 10+ | ~50-100ms | Varies |
| No Cache (v1.0) | 10+ | ~120-200ms | 0% |

**Rate Limiting:**

| Configuration | Distribution | Performance | Scalability |
|---------------|-------------|-------------|-------------|
| Redis | Distributed | Consistent | Multi-instance |
| In-Memory | Per-instance | Fast | Single-instance |

### Monitoring Performance

**Real-Time Monitoring**:
1. Enable Vercel Speed Insights
2. Monitor Core Web Vitals in Vercel dashboard
3. Set up alerts for performance degradation

**Regular Benchmarking**:
```bash
# Run locally (requires dev server)
npm run test:performance

# View detailed reports
open lighthouse-results/index.html
```

**CI/CD Integration**:
- Performance tests run automatically on pull requests
- Lighthouse CI prevents regressions
- Results stored as GitHub Actions artifacts

### Troubleshooting Performance Issues

**Slow Dashboard Loads**:
1. Check Redis connection (logs should show "Redis connected")
2. Verify cache hit rate in application logs
3. Check database query performance with Prisma debug: `DEBUG=prisma:* npm run dev`
4. Monitor Vercel function logs for slow queries

**High Memory Usage**:
1. Check for memory leaks in custom code
2. Monitor Vercel function memory usage
3. Consider upgrading Vercel plan for more memory

**Large Bundle Size**:
1. Run `npm run build` and check First Load JS size
2. Ensure code splitting is working (check for lazy imports)
3. Remove unused dependencies
4. Consider dynamic imports for heavy libraries

---

## Security Configuration

SmartBudget Version 2.0 includes comprehensive security features enabled by default. This section documents what's already configured and what needs verification during deployment.

### 1. Security Headers

Already configured in `next.config.js`:
- CSP (Content Security Policy)
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options (clickjacking protection)
- X-Content-Type-Options (MIME sniffing protection)
- Referrer-Policy
- Permissions-Policy
- X-XSS-Protection

Verify at: [securityheaders.com](https://securityheaders.com)

### 2. Authentication Security

- [x] NextAuth.js configured with secure defaults
- [x] Secure session cookies (HTTP-only, SameSite)
- [x] CSRF protection enabled
- [x] Password hashing (bcrypt)
- [x] Session token encryption
- [x] Rate limiting on auth endpoints (5 requests / 15 minutes)

### 3. Authorization (RBAC - Version 2.0)

- [x] Role-Based Access Control (USER, ADMIN)
- [x] Database-backed role checking
- [x] Jobs API requires ADMIN role
- [x] Resource ownership validation
- [x] Horizontal privilege escalation prevention
- [x] Vertical privilege escalation prevention

**Verify RBAC:**
1. Test that non-admin users get 403 on `/api/jobs/process`
2. Test that users can only access their own data
3. Verify admin users have correct role in database

### 4. Input Validation (Version 2.0)

- [x] Zod validation schemas on all 54 API endpoints
- [x] Type-safe schema composition
- [x] Request body validation
- [x] Query parameter validation
- [x] Enum validation for status fields
- [x] Date validation with zod-date
- [x] Automatic validation error messages

**Validation Coverage:**
- Authentication endpoints (signup, signin)
- Transaction CRUD (create, update, import, export)
- Budget management (create, update, delete)
- Account management (create, update, delete)
- ML operations (train, categorize)
- Job processing (process, status)

### 5. Rate Limiting (Version 2.0)

**Four-Tier System:**

| Tier | Endpoints | Limit | Window | Use Case |
|------|-----------|-------|--------|----------|
| STRICT | Auth (signup, signin) | 5 requests | 15 min | Prevent brute force |
| EXPENSIVE | ML, import, categorize | 10 requests | 60 min | Prevent abuse of costly ops |
| MODERATE | Standard API | 100 requests | 15 min | Normal API usage |
| LENIENT | Read-only | 300 requests | 15 min | High-volume reads |

**Protected Endpoints:**
- `/api/ml/train` - EXPENSIVE tier
- `/api/transactions/import` - EXPENSIVE tier
- `/api/transactions/export` - MODERATE tier
- `/api/transactions/categorize` - EXPENSIVE tier
- `/api/merchants/research` - EXPENSIVE tier
- All authentication endpoints - STRICT tier

**Rate Limiting Strategy:**
- Uses user ID for authenticated requests (preferred)
- Falls back to IP address for unauthenticated requests
- Sliding window algorithm prevents burst attacks
- Distributed with Redis (or per-instance with in-memory)

**Verify Rate Limiting:**
```bash
# Test auth rate limit (should block after 5 requests)
for i in {1..10}; do
  curl -X POST https://your-domain.com/api/auth/signup \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test123"}'
done
# Should see 429 Too Many Requests after 5th attempt
```

### 6. Data Security

- [x] HTTPS enforced (automatic with Vercel)
- [x] Database encrypted at rest (provider default)
- [x] Sensitive data filtering in Sentry
- [x] No secrets in client-side code
- [x] SQL injection prevention (Prisma ORM)
- [x] XSS prevention (React auto-escaping + CSP)

### 7. API Security

- [x] Authentication required for all sensitive endpoints
- [x] Composable middleware (withAuth, withAdmin, withRateLimit)
- [x] SQL injection prevention (Prisma parameterization)
- [x] NoSQL injection prevention (N/A - PostgreSQL only)
- [x] Command injection prevention (no shell execution)
- [x] Path traversal prevention (validated file paths)

### 8. OWASP Top 10 Compliance (Version 2.0)

SmartBudget v2.0 has been audited against OWASP Top 10 (2021):

| Vulnerability | Status | Mitigation |
|---------------|--------|------------|
| A01 - Broken Access Control | ✅ COMPLIANT | NextAuth + RBAC + resource ownership |
| A02 - Cryptographic Failures | ✅ COMPLIANT | HTTPS, HSTS, bcrypt, secure tokens |
| A03 - Injection | ✅ COMPLIANT | Prisma ORM, Zod validation, React escaping |
| A04 - Insecure Design | ✅ COMPLIANT | Security by design, defense in depth |
| A05 - Security Misconfiguration | ✅ COMPLIANT | Secure defaults, no debug in prod |
| A06 - Vulnerable Components | ⚠️ MINOR | 5 non-critical npm vulnerabilities (see audit) |
| A07 - Authentication Failures | ✅ COMPLIANT | Strong passwords, rate limiting, sessions |
| A08 - Data Integrity Failures | ✅ MOSTLY | npm lockfile, no SRI (minor) |
| A09 - Logging Failures | ✅ MOSTLY | Sentry integration, consider audit log |
| A10 - SSRF | ✅ COMPLIANT | No user-controlled URLs |

**Known Vulnerabilities:**
- 5 npm package vulnerabilities (1 moderate, 4 low)
- fast-xml-parser <4.1.2 (prototype pollution - mitigated with rate limiting)
- None are critical or production-blocking
- See security audit report for details

### 9. Security Checklist (Version 2.0)

**Before Deployment:**
- [ ] Update all dependencies: `npm update`
- [ ] Run security audit: `npm audit`
- [ ] Run full test suite: `npm run test:all`
- [ ] Verify Zod validation on all endpoints
- [ ] Verify rate limiting is active
- [ ] Verify RBAC is working (test with non-admin user)
- [ ] Check no secrets in client-side code
- [ ] Verify NEXTAUTH_SECRET is strong (32+ chars)
- [ ] Verify database connection uses SSL
- [ ] Review error messages (no sensitive data leaks)

**After Deployment:**
- [ ] Test SSL certificate: [ssllabs.com](https://www.ssllabs.com/ssltest/)
- [ ] Test security headers: [securityheaders.com](https://securityheaders.com)
- [ ] Test rate limiting on production
- [ ] Trigger test error to verify Sentry
- [ ] Attempt unauthorized access to admin endpoints
- [ ] Test RBAC with USER and ADMIN roles
- [ ] Monitor error logs for security issues

**Regular Maintenance:**
- [ ] Run `npm audit` monthly
- [ ] Update dependencies quarterly
- [ ] Review admin users quarterly
- [ ] Rotate NEXTAUTH_SECRET annually
- [ ] Review security logs monthly
- [ ] Test backup/restore quarterly

### 10. Security Monitoring

**Real-Time Monitoring:**
1. Sentry alerts for security errors
2. Rate limit violation logging
3. Failed authentication attempt logging
4. Unauthorized access attempt logging

**What to Monitor:**
- Spike in 401 Unauthorized responses
- Spike in 403 Forbidden responses
- Spike in 429 Too Many Requests
- Unusual API access patterns
- Failed login attempts

**Alerting:**
Configure Sentry alerts for:
- Critical security errors (immediate)
- High rate of authentication failures (15 min)
- Unauthorized admin access attempts (immediate)
- Database connection failures (5 min)

### 11. Incident Response

**If Security Issue Detected:**

1. **Immediate Actions**:
   - Roll back to previous deployment if breach suspected
   - Revoke compromised credentials
   - Enable maintenance mode if necessary

2. **Investigation**:
   - Check Sentry for error logs
   - Review Vercel function logs
   - Check database for unauthorized changes
   - Identify scope of issue

3. **Remediation**:
   - Patch vulnerability
   - Deploy fix
   - Verify fix effectiveness
   - Monitor for recurrence

4. **Post-Incident**:
   - Document incident
   - Update security measures
   - Notify affected users (if required)
   - Conduct security review

### 12. Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [Vercel Security](https://vercel.com/docs/security)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/security)
- [NextAuth.js Security](https://next-auth.js.org/configuration/security)

---

## Post-Deployment Verification

### 1. Smoke Tests

Test critical functionality:

**Basic Functionality:**
- [ ] Homepage loads correctly
- [ ] User can sign up (test rate limiting after 5 attempts)
- [ ] User can sign in
- [ ] Dashboard displays correctly
- [ ] Skeleton loaders appear during initial load

**Transaction Management:**
- [ ] User can create transaction manually
- [ ] User can import transactions (CSV/OFX)
- [ ] User can edit transaction
- [ ] User can delete transaction
- [ ] Transactions list displays correctly

**Budget Management:**
- [ ] User can create budget
- [ ] Budget wizard works (multi-step)
- [ ] Budget analytics displays correctly
- [ ] Budget alerts work

**Account Management:**
- [ ] User can create account
- [ ] Account details display correctly
- [ ] Account filtering works

**AI Features:**
- [ ] ML categorization works
- [ ] Claude AI merchant lookup works
- [ ] Training completes successfully

**Admin Features (Version 2.0):**
- [ ] Admin user can access `/api/jobs/process`
- [ ] Non-admin user gets 403 on admin endpoints
- [ ] RBAC is enforced correctly

**Caching (Version 2.0):**
- [ ] Redis connection successful (check logs)
- [ ] Dashboard loads quickly (<50ms cached)
- [ ] Cache invalidation works (create transaction, refresh dashboard)

### 2. Performance Tests (Version 2.0)

Run comprehensive performance benchmarks:

```bash
# Full performance test suite
npm run test:performance

# Or test specific URLs
npm run test:performance -- --url=https://your-domain.com
```

**Target Metrics:**
- [ ] Lighthouse Performance: >90 (all pages)
- [ ] Lighthouse Accessibility: >95 (all pages)
- [ ] Lighthouse Best Practices: >90 (all pages)
- [ ] Lighthouse SEO: >90 (all pages)
- [ ] First Contentful Paint (FCP): <1.5s
- [ ] Largest Contentful Paint (LCP): <2.5s
- [ ] Time to Interactive (TTI): <3.0s
- [ ] Cumulative Layout Shift (CLS): <0.1
- [ ] Total Blocking Time (TBT): <200ms

**API Performance:**
```bash
# Test dashboard endpoint (should be fast with cache)
time curl -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  https://your-domain.com/api/dashboard/overview

# Should return in <50ms with Redis cache
# Should return in <100ms without cache
```

**Performance Checklist:**
- [ ] Dashboard loads in <2s (first load)
- [ ] Dashboard loads in <500ms (cached)
- [ ] Transaction list loads in <1s (100 transactions)
- [ ] No layout shifts (CLS <0.1)
- [ ] Skeleton loaders appear immediately
- [ ] Charts load smoothly (code-split, lazy loaded)
- [ ] No console errors or warnings

### 3. Security Tests (Version 2.0)

**SSL and Headers:**
- [ ] SSL certificate valid (A+ rating at [ssllabs.com](https://www.ssllabs.com/ssltest/))
- [ ] Security headers present (A+ at [securityheaders.com](https://securityheaders.com))
- [ ] No mixed content warnings
- [ ] HTTPS redirect working

**Authentication:**
- [ ] Cannot access protected routes without login
- [ ] Session persists across page refreshes
- [ ] Logout works correctly
- [ ] Rate limiting blocks after threshold (5 signups / 15min)

**Authorization (RBAC):**
```bash
# Test as non-admin user
curl -X POST https://your-domain.com/api/jobs/process \
  -H "Cookie: next-auth.session-token=USER_SESSION" \
  -H "Content-Type: application/json"
# Should return 403 Forbidden

# Test as admin user
curl -X POST https://your-domain.com/api/jobs/process \
  -H "Cookie: next-auth.session-token=ADMIN_SESSION" \
  -H "Content-Type: application/json"
# Should return 200 OK
```

**Input Validation:**
- [ ] Invalid email rejected on signup (400 Bad Request)
- [ ] Invalid transaction data rejected (400 Bad Request)
- [ ] SQL injection attempts blocked (Prisma)
- [ ] XSS attempts escaped (React + CSP)

**Rate Limiting:**
```bash
# Test auth rate limit (5 requests / 15 min)
for i in {1..10}; do
  curl -X POST https://your-domain.com/api/auth/signup \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test$i@example.com\",\"password\":\"Test123!\"}"
  echo ""
done
# Should see 429 after 5th request
```

- [ ] Auth endpoints rate limited (5/15min)
- [ ] ML endpoints rate limited (10/hour)
- [ ] Import endpoints rate limited (10/hour)
- [ ] Standard API rate limited (100/15min)

### 4. Error Monitoring

**Sentry Integration:**
- [ ] Trigger test error
- [ ] Verify error appears in Sentry
- [ ] Check alert notifications
- [ ] Verify source maps uploaded

Trigger test error:
```bash
# Create a test API endpoint that throws
curl https://your-domain.com/api/sentry-example-api
```

**Error Handling:**
- [ ] 404 page displays correctly
- [ ] 500 error page displays correctly (if applicable)
- [ ] API errors return proper status codes
- [ ] Error messages don't leak sensitive data
- [ ] Sentry captures client-side errors

### 5. Database Verification

**Schema:**
```bash
# Connect to production database
export DATABASE_URL="your-production-database-url"
npx prisma studio

# Verify:
# - All tables exist
# - User table has 'role' field (v2.0)
# - Indexes are created
# - Seed data present (if applicable)
```

**RBAC Verification:**
```sql
-- Check user roles
SELECT id, email, role FROM "User" LIMIT 10;

-- Verify admin users
SELECT email, role FROM "User" WHERE role = 'ADMIN';

-- Verify default role
SELECT role, COUNT(*) FROM "User" GROUP BY role;
```

**Performance:**
- [ ] Database queries complete quickly (<50ms average)
- [ ] No slow query warnings in logs
- [ ] Connection pooling working (no "too many connections" errors)

### 6. Redis Verification (Version 2.0)

**If Redis Configured:**
```bash
# Check Redis connection in application logs
# Look for: "Redis connected successfully"

# Test cache hit
# 1. Load dashboard (cache miss - slow)
# 2. Load dashboard again (cache hit - fast)
# 3. Create transaction
# 4. Load dashboard (cache invalidated - slow)
```

**Checklist:**
- [ ] Redis connection successful (check logs)
- [ ] Cache hit rate >70% for dashboard (after warmup)
- [ ] Cache invalidation works on transaction mutations
- [ ] Rate limiting distributed across instances

**If Redis Not Configured:**
- [ ] Application still works (in-memory fallback)
- [ ] Logs show "Redis unavailable, using in-memory cache"
- [ ] Performance still acceptable (per-instance caching)

### 7. Accessibility Tests (Version 2.0)

Run accessibility audit:
```bash
# Run E2E accessibility tests
npm run test:accessibility

# Or use Lighthouse
npx lighthouse https://your-domain.com --only-categories=accessibility --view
```

**Manual Checks:**
- [ ] All interactive elements keyboard accessible
- [ ] Screen reader announces content correctly
- [ ] Color contrast ratios meet WCAG AA (4.5:1)
- [ ] Focus indicators visible
- [ ] No keyboard traps
- [ ] ARIA labels present on icon buttons
- [ ] Form labels associated correctly

### 8. Mobile Responsiveness (Version 2.0)

**Test on Multiple Devices:**
- [ ] iPhone (iOS Safari)
- [ ] Android (Chrome)
- [ ] Tablet (iPad)

**Check:**
- [ ] Bottom navigation bar appears on mobile
- [ ] Hamburger menu works
- [ ] No horizontal scrolling
- [ ] Touch targets at least 44x44px
- [ ] Text readable without zoom
- [ ] Forms usable on mobile
- [ ] Charts responsive

### 9. Cross-Browser Tests (Version 2.0)

Run cross-browser test suite:
```bash
npm run test:cross-browser
```

**Browsers:**
- [ ] Chrome (desktop)
- [ ] Edge (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (desktop)
- [ ] Chrome (Android)
- [ ] Safari (iOS)

### 10. Integration Tests (Version 2.0)

Run full test suite:
```bash
# All tests
npm run test:all

# Or individually
npm run test           # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e       # E2E tests
```

**Expected Results:**
- [ ] All unit tests pass (35+ tests)
- [ ] All integration tests pass (76+ tests)
- [ ] All E2E tests pass (189+ tests)
- [ ] All accessibility tests pass (20+ tests)
- [ ] No TypeScript errors
- [ ] No ESLint errors

---

## Monitoring and Alerting

### Vercel Monitoring

1. **Deployment Status**:
   - Monitor deployment success/failure
   - Set up Slack/email notifications

2. **Analytics**:
   - Page views
   - Top pages
   - Unique visitors
   - Performance metrics

3. **Logs**:
   - Real-time logs in Vercel dashboard
   - Function logs
   - Edge logs

### Sentry Alerts

1. **Error Alerts**:
   - Critical errors (5xx)
   - High error rate
   - New error types

2. **Performance Alerts**:
   - Slow API endpoints (>500ms)
   - High memory usage
   - Long database queries

3. **User Impact Alerts**:
   - High error rate per user
   - Session crashes

### Database Monitoring

1. **Connection Pool**:
   - Monitor active connections
   - Alert on connection exhaustion

2. **Query Performance**:
   - Slow query log
   - Query count

3. **Storage**:
   - Database size
   - Storage limits

### Custom Monitoring

Create a `/api/health` endpoint:

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    sentry: await checkSentry(),
    uptime: process.uptime(),
  }
  return Response.json(checks)
}
```

Set up external monitoring:
- UptimeRobot (free)
- Pingdom
- StatusCake

---

## Backup and Recovery

### Database Backups

#### Neon PostgreSQL

1. **Automatic Backups**:
   - Neon: Automatic daily backups (7-day retention on free plan)
   - Configure in Neon dashboard

2. **Manual Backup**:
   ```bash
   pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
   ```

3. **Automated Backup Script**:
   ```bash
   #!/bin/bash
   DATE=$(date +%Y%m%d-%H%M%S)
   pg_dump $DATABASE_URL | gzip > backups/backup-$DATE.sql.gz
   # Upload to S3, Google Cloud Storage, etc.
   ```

#### Supabase PostgreSQL

1. **Automatic Backups**:
   - Daily backups (7-day retention on free plan)
   - Point-in-time recovery on paid plans

2. **Manual Backup**:
   - Go to Supabase Dashboard → Database → Backups
   - Download backup

### Restore Procedure

1. **From Backup File**:
   ```bash
   # Restore from backup
   psql $DATABASE_URL < backup-20240115.sql
   ```

2. **From Neon**:
   - Go to Neon dashboard
   - Select backup date
   - Restore to new branch or main

3. **From Supabase**:
   - Go to Supabase Dashboard
   - Select backup
   - Restore

### Disaster Recovery Plan

1. **Database Failure**:
   - Restore from latest backup
   - Update DATABASE_URL if necessary
   - Redeploy application

2. **Application Failure**:
   - Roll back to previous deployment
   - Check Vercel deployment history
   - Restore from Git commit

3. **Data Corruption**:
   - Identify affected data
   - Restore from backup
   - Run data integrity checks

---

## Rollback Procedures

### Application Rollback

#### Via Vercel Dashboard

1. Go to **Deployments**
2. Find previous working deployment
3. Click **⋯** → **Promote to Production**

#### Via Vercel CLI

```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback YOUR_DEPLOYMENT_URL
```

#### Via Git

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# OR reset to specific commit
git reset --hard COMMIT_HASH
git push --force origin main
```

### Database Rollback

1. **Revert Migration**:
   ```bash
   npx prisma migrate resolve --rolled-back MIGRATION_NAME
   ```

2. **Restore from Backup** (see Backup and Recovery section)

### Emergency Rollback Checklist

- [ ] Identify issue and affected users
- [ ] Notify team
- [ ] Roll back application
- [ ] Verify rollback successful
- [ ] Test critical functionality
- [ ] Monitor error rates
- [ ] Communicate with users (if necessary)
- [ ] Document incident
- [ ] Plan fix and re-deployment

---

## Troubleshooting

### Common Issues

#### 1. Redis Connection Issues (Version 2.0)

**Error**: `Redis unavailable, using in-memory cache`

This is a **warning**, not an error. The application continues to work with in-memory fallback.

**If you want Redis to work:**

1. **Verify Environment Variables**:
   ```bash
   # Check if variables are set in Vercel
   vercel env ls

   # Should see:
   # UPSTASH_REDIS_REST_URL
   # UPSTASH_REDIS_REST_TOKEN
   ```

2. **Test Redis Connection**:
   ```bash
   # Test with curl
   curl -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" \
     "$UPSTASH_REDIS_REST_URL/ping"

   # Should return: {"result":"PONG"}
   ```

3. **Common Causes**:
   - Environment variables not set in Vercel
   - Typo in variable names (must be exact)
   - Invalid token (expired or incorrect)
   - Upstash database paused/deleted
   - Network connectivity issues

4. **Verify in Logs**:
   ```bash
   # Check Vercel function logs
   vercel logs YOUR_DEPLOYMENT_URL

   # Look for:
   # ✅ "Redis connected successfully"
   # ⚠️ "Redis unavailable, using in-memory cache"
   ```

**Error**: `Rate limiting not working across instances`

If you have Redis configured but rate limiting seems to allow more requests than expected:

1. **Check Redis is actually connected** (see above)
2. **Verify rate limiter is using Redis**:
   ```typescript
   // Check logs for:
   // "Using Redis-based rate limiter"
   // NOT "Using in-memory rate limiter"
   ```
3. **Clear Redis cache** if testing:
   ```bash
   # Via Upstash console
   # Data Browser → FLUSHDB
   ```

**Error**: `Cache not invalidating`

If creating/updating transactions doesn't refresh dashboard:

1. **Check cache invalidation in logs**:
   ```typescript
   // Should see: "Invalidated cache: dashboard:overview:user123:*"
   ```

2. **Manual cache clear**:
   ```bash
   # Via Upstash console
   # Find keys matching pattern: dashboard:*
   # Delete manually
   ```

3. **Verify Redis connection** (connection failures = no invalidation)

**Performance Issue**: `Dashboard still slow with Redis`

1. **Verify cache is being used**:
   - First load: Slow (~50-100ms) - cache miss
   - Second load: Fast (~10-20ms) - cache hit
   - After transaction change: Slow again - cache invalidated

2. **Check cache hit rate**:
   ```bash
   # In application logs
   # Look for: "Cache hit: dashboard:overview:user123"
   # vs "Cache miss: dashboard:overview:user123"
   ```

3. **Database might be slow**:
   - Check database provider dashboard
   - Verify connection pooling enabled
   - Check for slow queries

**When to Use In-Memory vs Redis:**

| Scenario | Recommendation |
|----------|----------------|
| Development | In-memory (simpler) |
| Staging | Redis (test prod config) |
| Production (single instance) | Either (Redis recommended) |
| Production (multi instance) | Redis (required for distributed rate limiting) |
| Low traffic (<100 users) | In-memory (acceptable) |
| High traffic (>100 users) | Redis (better performance) |

#### 2. Build Failures

**Error**: `Module not found`
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Error**: `Prisma Client not generated`
```bash
npx prisma generate
npm run build
```

**Error**: `Type error in TypeScript`
```bash
# Version 2.0 should have zero TypeScript errors
# If you see any, check:
npm run build

# Common causes:
# - Missing Prisma generation
# - Outdated dependencies
# - Incorrect import paths
```

#### 3. Database Connection Issues

**Error**: `Can't reach database server`
```bash
# Test connection
npx prisma db push --skip-generate

# Check DATABASE_URL format
# Ensure SSL mode: ?sslmode=require
# Check firewall/IP allowlist
```

**Error**: `Too many connections`
```bash
# Use connection pooling
# Reduce connection limit in DATABASE_URL
# Check for connection leaks
```

#### 4. Authentication Issues

**Error**: `NEXTAUTH_URL not configured`
```bash
# Ensure NEXTAUTH_URL is set in Vercel
# Format: https://your-domain.com (no trailing slash)
```

**Error**: `Invalid session`
```bash
# Regenerate NEXTAUTH_SECRET
# Clear cookies
# Check DATABASE_URL
```

**Error**: `User gets 403 Forbidden on admin endpoint`

Version 2.0 uses RBAC. Check user role:
```sql
SELECT email, role FROM "User" WHERE email = 'user@example.com';
```

If role is `USER`, promote to `ADMIN`:
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'user@example.com';
```

User must re-login after role change.

#### 5. Rate Limiting Issues (Version 2.0)

**Error**: `429 Too Many Requests` (legitimate user)

Rate limits might be too strict for your use case. Adjust in `src/lib/rate-limiter.ts`:

```typescript
// Current limits:
STRICT: 5 requests / 15 min    // Auth endpoints
EXPENSIVE: 10 requests / 1 hour // ML, import, categorize
MODERATE: 100 requests / 15 min // Standard API
LENIENT: 300 requests / 15 min  // Read-only

// Increase if needed (be cautious)
```

**Error**: Rate limiting allows more requests than expected

- Check if Redis is connected (in-memory is per-instance)
- Verify rate limiter logs show "Using Redis-based rate limiter"
- If using multiple Vercel instances, Redis is required for distributed limiting

#### 6. Sentry Issues

**Error**: `Sentry not capturing errors`
```bash
# Verify SENTRY_DSN is set
# Check Sentry project configuration
# Test with: throw new Error('Test')
```

#### 7. Performance Issues (Version 2.0)

**Slow page loads**:
1. **Check Redis connection** (should reduce load by 80-90%)
   - Look for "Redis connected" in logs
   - Verify cache hit rate >70% after warmup

2. **Check database performance**:
   ```bash
   # Enable Prisma debug logging
   DEBUG=prisma:* npm run dev
   # Look for slow queries (>100ms)
   ```

3. **Verify code splitting**:
   ```bash
   npm run build
   # Check "First Load JS" sizes
   # Should be ~90-110KB (not >200KB)
   ```

4. **Run performance benchmarks**:
   ```bash
   npm run test:performance
   # Target: >90 on all Lighthouse scores
   ```

**High memory usage**:
- Check for memory leaks in custom code
- Monitor Vercel function memory usage
- Optimize database queries
- Consider upgrading Vercel plan

**Dashboard slow even with Redis**:
1. Verify Redis is actually being used (check logs)
2. Check database query performance
3. Verify cache TTL is 5 minutes (not expired)
4. Check network latency to database

**Charts not lazy loading**:
- Verify Suspense boundaries in place
- Check browser console for errors
- Verify dynamic imports: `const Chart = dynamic(() => import(...))`

### Debug Tools

1. **Vercel Logs**:
   ```bash
   vercel logs YOUR_DEPLOYMENT_URL
   ```

2. **Prisma Debug**:
   ```bash
   DEBUG=prisma:* npm run dev
   ```

3. **Next.js Debug**:
   ```bash
   NODE_OPTIONS='--inspect' npm run dev
   ```

### Getting Help

1. **Vercel Support**:
   - Documentation: [vercel.com/docs](https://vercel.com/docs)
   - Community: [vercel.com/community](https://vercel.com/community)
   - Email: support@vercel.com

2. **Database Provider Support**:
   - Neon: [neon.tech/docs](https://neon.tech/docs)
   - Supabase: [supabase.com/docs](https://supabase.com/docs)

3. **Sentry Support**:
   - Documentation: [docs.sentry.io](https://docs.sentry.io)
   - Forum: [forum.sentry.io](https://forum.sentry.io)

---

## Deployment Success Checklist

Before marking deployment as complete:

**Infrastructure:**
- [ ] Application deployed to Vercel
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active (A+ rating)
- [ ] All environment variables set (including Redis if using)
- [ ] Database migrations run successfully
- [ ] Database seeded with initial data (if applicable)

**Monitoring:**
- [ ] Sentry error monitoring active
- [ ] Vercel Analytics enabled
- [ ] Vercel Speed Insights enabled
- [ ] Error alerts configured
- [ ] Performance monitoring set up

**Version 2.0 Specific:**
- [ ] Redis configured and connected (or verified in-memory fallback works)
- [ ] Admin users promoted to ADMIN role in database
- [ ] RBAC tested (admin and non-admin users)
- [ ] Rate limiting verified (test auth, ML, import endpoints)
- [ ] Zod validation active on all endpoints
- [ ] Code splitting verified (bundle size <110KB)
- [ ] Cache invalidation working

**Testing:**
- [ ] All smoke tests passing
- [ ] E2E test suite passing (189+ tests)
- [ ] Accessibility tests passing (20+ tests)
- [ ] Performance benchmarks run (>90 Lighthouse scores)
- [ ] Cross-browser tests verified (9 browsers)
- [ ] Mobile responsiveness verified

**Performance:**
- [ ] Lighthouse Performance score >90
- [ ] Lighthouse Accessibility score >95
- [ ] Lighthouse Best Practices score >90
- [ ] Lighthouse SEO score >90
- [ ] Core Web Vitals meeting targets (FCP <1.5s, LCP <2.5s, CLS <0.1)
- [ ] Dashboard loads in <500ms (cached)
- [ ] Dashboard loads in <2s (uncached)

**Security:**
- [ ] Security headers configured (A+ rating)
- [ ] Rate limiting enforced
- [ ] RBAC working correctly
- [ ] Input validation tested
- [ ] SSL/TLS verified
- [ ] No secrets in client-side code
- [ ] Authentication tested
- [ ] Authorization tested

**Documentation:**
- [ ] Backups configured
- [ ] Documentation updated
- [ ] Team notified of deployment
- [ ] Version 2.0 changes communicated
- [ ] Admin user list documented
- [ ] Redis configuration documented (if used)

---

## Next Steps

After successful deployment:

1. **Monitor for 24 hours**:
   - Check error rates
   - Monitor performance
   - Watch for issues

2. **Gather User Feedback**:
   - Beta testing
   - User interviews
   - Analytics review

3. **Iterate**:
   - Fix bugs
   - Optimize performance
   - Add features

4. **Scale**:
   - Upgrade database plan if needed
   - Optimize for higher traffic
   - Consider CDN for static assets

---

## Support

For deployment support, contact:
- Technical Lead: [Your Email]
- DevOps: [DevOps Email]
- Emergency: [Emergency Contact]

---

## Appendix

### Useful Commands

```bash
# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs

# Run migrations
npx prisma migrate deploy

# Seed database
npm run db:seed

# Generate Prisma client
npx prisma generate

# Open Prisma Studio
npx prisma studio

# Run tests
npm run test

# Build locally
npm run build

# Start production build
npm run start
```

### Useful Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Sentry Documentation](https://docs.sentry.io)
- [Neon Documentation](https://neon.tech/docs)
- [Supabase Documentation](https://supabase.com/docs)

---

**Last Updated**: 2026-01-16
**Version**: 2.0.0
**Status**: Production Ready

---

## Version 2.0 Summary

SmartBudget Version 2.0 is a major update focused on performance, security, and scalability:

**Key Improvements:**
- 🚀 **Performance**: 80-90% reduction in database load with Redis caching
- 🔒 **Security**: Comprehensive Zod validation, 4-tier rate limiting, database-backed RBAC
- 📦 **Bundle Size**: 50% reduction in initial bundle (130-160KB gzipped deferred)
- ✅ **Testing**: 260+ E2E tests, accessibility testing, performance benchmarks
- 📱 **Mobile**: Bottom nav, hamburger menu, responsive design improvements
- ⚡ **Optimizations**: Single-pass aggregation, code splitting, skeleton loaders

**Breaking Changes:**
- Admin access now requires ADMIN role in database (not environment variable)
- Jobs API now requires authentication and ADMIN role
- New rate limits may affect high-volume usage

**Optional Features:**
- Redis (recommended for production, falls back to in-memory)

**Migration Required:**
- Run database migrations to add `role` field
- Promote admin users to ADMIN role in database

For detailed information, see [Version 2.0 Deployment Notes](#version-20-deployment-notes) above.
