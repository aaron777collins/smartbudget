# SmartBudget Production Deployment Guide

This guide provides comprehensive instructions for deploying SmartBudget to production on Vercel with PostgreSQL database hosting.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
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

## Prerequisites

Before deploying to production, ensure you have:

- [x] **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
- [x] **GitHub Repository**: Code pushed to GitHub (recommended for automatic deployments)
- [x] **PostgreSQL Database**: Neon, Supabase, or other cloud PostgreSQL provider
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
- [ ] Rate limiting enabled
- [ ] Security headers configured

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

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | PostgreSQL connection string | Production, Preview |
| `NEXTAUTH_SECRET` | Random secret (32+ chars) | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://your-domain.com` | Production |
| `ANTHROPIC_API_KEY` | Anthropic API key | Production, Preview |
| `SENTRY_DSN` | Sentry server DSN | Production, Preview |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry public DSN | Production, Preview |
| `SENTRY_ORG` | Sentry organization | Production, Preview |
| `SENTRY_PROJECT` | Sentry project | Production, Preview |
| `SENTRY_AUTH_TOKEN` | Sentry auth token | Production |

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

### 1. Enable Caching

Already configured in `next.config.js`:
- API routes: 5-60 minute cache
- Static assets: Long-term cache
- Images: Optimized with AVIF/WebP

### 2. Database Optimization

```prisma
// Indexes already configured in schema.prisma
@@index([userId, date])
@@index([accountId, date])
@@index([merchantName])
```

**Connection Pooling**:
- Use Prisma connection pooling
- Set connection limits in DATABASE_URL:
  ```
  DATABASE_URL="postgresql://...?connection_limit=10&pool_timeout=10"
  ```

### 3. Edge Functions (Optional)

For global performance, deploy API routes to Edge:

```typescript
// app/api/route.ts
export const runtime = 'edge'
```

### 4. Image Optimization

Already configured:
- Next.js Image component
- AVIF/WebP formats
- Responsive images

### 5. Bundle Size Optimization

Monitor bundle size:
```bash
npm run build
# Analyze output
```

### 6. Vercel Analytics

Enable in Vercel Dashboard:
- Project Settings → Analytics
- Web Analytics (free)
- Speed Insights (free)

---

## Security Configuration

### 1. Security Headers

Already configured in `next.config.js`:
- CSP (Content Security Policy)
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options (clickjacking protection)
- X-Content-Type-Options (MIME sniffing protection)
- Referrer-Policy

### 2. Authentication Security

- [x] NextAuth.js configured
- [x] Secure session cookies
- [x] CSRF protection enabled
- [x] Password hashing (bcrypt)

### 3. API Security

- [x] Authentication required for all sensitive endpoints
- [x] Input validation with Zod
- [x] SQL injection prevention (Prisma)
- [x] Rate limiting configured

### 4. Data Security

- [x] HTTPS enforced
- [x] Database encrypted at rest (provider default)
- [x] Sensitive data filtering in Sentry
- [x] No secrets in client-side code

### 5. Security Checklist

- [ ] Update all dependencies to latest versions
- [ ] Run security audit: `npm audit`
- [ ] Review OWASP Top 10
- [ ] Set up security.txt file
- [ ] Configure CORS policy
- [ ] Enable rate limiting
- [ ] Set up DDoS protection (Vercel default)
- [ ] Review error messages (no sensitive data leak)

---

## Post-Deployment Verification

### 1. Smoke Tests

Test critical functionality:

- [ ] Homepage loads correctly
- [ ] User can sign up
- [ ] User can sign in
- [ ] User can import transactions
- [ ] Dashboard displays data
- [ ] Budgets can be created
- [ ] Claude AI lookup works
- [ ] Sentry errors are logged

### 2. Performance Tests

- [ ] Lighthouse score: 90+ (Performance, Accessibility, Best Practices, SEO)
- [ ] Page load time: <2 seconds
- [ ] Time to Interactive: <3 seconds
- [ ] API response time: <200ms
- [ ] Database query time: <50ms

Run Lighthouse:
```bash
npx lighthouse https://your-domain.com --view
```

### 3. Security Tests

- [ ] SSL certificate valid (check at [ssllabs.com](https://www.ssllabs.com/ssltest/))
- [ ] Security headers present (check at [securityheaders.com](https://securityheaders.com))
- [ ] No mixed content warnings
- [ ] HTTPS redirect working

### 4. Error Monitoring

- [ ] Trigger test error
- [ ] Verify error appears in Sentry
- [ ] Check alert notifications

Trigger test error:
```bash
# Visit: https://your-domain.com/api/test-error
curl https://your-domain.com/api/sentry-example-api
```

### 5. Database Verification

```bash
# Connect to production database
npx prisma studio --browser none

# Verify tables exist
# Verify seed data present
# Test query performance
```

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

#### 1. Build Failures

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

#### 2. Database Connection Issues

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

#### 3. Authentication Issues

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

#### 4. Sentry Issues

**Error**: `Sentry not capturing errors`
```bash
# Verify SENTRY_DSN is set
# Check Sentry project configuration
# Test with: throw new Error('Test')
```

#### 5. Performance Issues

**Slow page loads**:
- Check Vercel Analytics
- Review database query performance
- Optimize images
- Enable caching

**High memory usage**:
- Check for memory leaks
- Optimize database queries
- Reduce bundle size

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

- [ ] Application deployed to Vercel
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] All environment variables set
- [ ] Database migrations run successfully
- [ ] Database seeded with initial data
- [ ] Sentry error monitoring active
- [ ] Vercel Analytics enabled
- [ ] All smoke tests passing
- [ ] Lighthouse score 90+
- [ ] Security headers configured
- [ ] Backups configured
- [ ] Monitoring and alerts set up
- [ ] Documentation updated
- [ ] Team notified of deployment

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

**Last Updated**: 2026-01-14
**Version**: 1.0.0
**Status**: Production Ready
