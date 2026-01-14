# SmartBudget Deployment Plan

## Overview
Deploy SmartBudget to budget.aaroncollins.info with full Claude AI integration via GLM Gateway, Supabase database, and containerized infrastructure.

## Current Infrastructure Analysis

### Existing Setup
- **Domain**: aaroncollins.info (managed by Caddy)
- **Caddy Config**: ~/webstack/caddy/Caddyfile
- **Container Network**: "internal" network for service communication
- **AICEO Reference**: Full-stack app with Claude integration via GLM Gateway

### AICEO Architecture (Reference for SmartBudget)
- API: Node.js backend with Claude integration
- UI: Next.js frontend with NextAuth
- Database: PostgreSQL (for SmartBudget: will use Supabase)
- Claude Integration: GLM Gateway API key (a6bd63cab66c494f8c5354381c98f29e.uXIZaD5Qrt4cISck)
- Auth: NextAuth with GitHub OAuth

## Deployment Goals

### 1. Domain & Routing
- [x] Configure budget.aaroncollins.info → SmartBudget application
- [x] Setup Caddy reverse proxy routing
- [x] Handle /api/auth/* routes to Next.js (NextAuth)
- [x] Route other /api/* to Next.js API routes
- [x] SSL/TLS via Let's Encrypt (automatic via Caddy)

### 2. Database Setup
- [ ] Use Supabase PostgreSQL (supabase CLI authenticated)
- [ ] Create new Supabase project or use existing
- [ ] Run Prisma migrations
- [ ] Seed initial data (categories, etc.)
- [ ] Configure connection pooling for production

### 3. Application Configuration
- [ ] Create .env file with production values
- [ ] Configure DATABASE_URL (Supabase connection string)
- [ ] Setup NEXTAUTH_URL=https://budget.aaroncollins.info
- [ ] Generate NEXTAUTH_SECRET
- [ ] Configure Claude AI integration via GLM Gateway
- [ ] Setup GitHub OAuth (reuse AICEO credentials or create new)

### 4. Claude AI Integration
**Strategy**: Copy AICEO dashboard pattern for Claude integration
- [ ] Use GLM Gateway API key: a6bd63cab66c494f8c5354381c98f29e.uXIZaD5Qrt4cISck
- [ ] Implement Claude API calls for:
  - Transaction categorization
  - Merchant lookup/research
  - Budget insights and recommendations
  - Financial analysis
- [ ] Copy dashboard components from AICEO/ui/components/dashboard/
- [ ] Adapt for SmartBudget's financial use case

### 5. Docker Setup
- [ ] Create Dockerfile for Next.js production build
- [ ] Create docker-compose.yml with:
  - smartbudget-app service
  - Container name: smartbudget-app
  - Port: 3002:3000 (internal)
  - Network: internal (to connect with Caddy)
  - Environment variables from .env
  - Volume mounts for file uploads
- [ ] No local PostgreSQL container (using Supabase)

### 6. File Upload Handling
- [ ] Configure upload directory: ~/repos/smartbudget/uploads
- [ ] Create directory structure for CSV/OFX imports
- [ ] Setup proper permissions
- [ ] Add volume mount in docker-compose.yml
- [ ] Configure Next.js for file handling

### 7. Caddy Configuration
- [ ] Backup current Caddyfile: ~/webstack/caddy/Caddyfile.backup-$(date +%Y%m%d-%H%M%S)
- [ ] Add budget.aaroncollins.info block:
  ```
  budget.aaroncollins.info {
      # NextAuth routes go to Next.js
      handle /api/auth/* {
          reverse_proxy smartbudget-app:3000
      }
      # Other API routes go to Next.js
      handle /api/* {
          reverse_proxy smartbudget-app:3000
      }
      # Everything else goes to Next.js
      handle {
          reverse_proxy smartbudget-app:3000
      }
  }
  ```
- [ ] Reload Caddy: docker exec caddy caddy reload --config /etc/caddy/Caddyfile

### 8. Vercel/Cloud Integration (Future-Ready)
- [ ] Keep Vercel configuration in vercel.json
- [ ] Document deployment to Vercel as alternative
- [ ] Ensure code works in both environments

### 9. CIBC API (Future Feature)
**Note**: Not implementing now, but prepare for it
- [ ] Document CIBC API integration requirements
- [ ] Design architecture for bank connection
- [ ] Keep CSV/OFX import as primary method
- [ ] Add placeholder for future API integration

## Implementation Steps

### Phase 1: Preparation (Before Ralph Plan)
1. **Backup Caddy Config**
   ```bash
   cp ~/webstack/caddy/Caddyfile ~/webstack/caddy/Caddyfile.backup-$(date +%Y%m%d-%H%M%S)
   ```

2. **Setup Supabase Database**
   ```bash
   cd ~/repos/smartbudget
   supabase projects list
   # Create new project or get connection string
   supabase db remote set <connection-string>
   ```

3. **Create .env File**
   ```bash
   cd ~/repos/smartbudget
   cp .env.example .env
   # Edit with production values
   ```

4. **Install Dependencies**
   ```bash
   cd ~/repos/smartbudget
   npm install
   ```

### Phase 2: Ralph Planning (Nohup)
```bash
cd ~/repos/smartbudget
nohup ~/repos/AICEO/ralph/ralph.sh ./SMARTBUDGET_DEPLOYMENT_PLAN.md plan 30 > ralph_plan.log 2>&1 &
```

### Phase 3: Ralph Build (Nohup)
```bash
cd ~/repos/smartbudget
nohup ~/repos/AICEO/ralph/ralph.sh ./SMARTBUDGET_DEPLOYMENT_PLAN.md build 30 > ralph_build.log 2>&1 &
```

### Phase 4: Post-Deployment
1. **Run Database Migrations**
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

2. **Build and Start Docker Containers**
   ```bash
   docker-compose build
   docker-compose up -d
   ```

3. **Reload Caddy**
   ```bash
   cd ~/webstack
   docker-compose exec caddy caddy reload --config /etc/caddy/Caddyfile
   ```

4. **Verify Deployment**
   - Check https://budget.aaroncollins.info
   - Test authentication
   - Test file upload
   - Test Claude AI categorization
   - Monitor logs: `docker logs -f smartbudget-app`

## Environment Variables

### Production .env
```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# NextAuth
NEXTAUTH_URL="https://budget.aaroncollins.info"
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"

# GitHub OAuth (can reuse AICEO credentials)
GITHUB_ID="Ov23liprBZ92hYOy6QbR"
GITHUB_SECRET="4ed4211e6a4841b441dd5ef0b169cbd9f29e24ff"

# Claude AI via GLM Gateway
ANTHROPIC_API_KEY="a6bd63cab66c494f8c5354381c98f29e.uXIZaD5Qrt4cISck"
# OR configure to use GLM Gateway endpoint
GLM_API_KEY="a6bd63cab66c494f8c5354381c98f29e.uXIZaD5Qrt4cISck"
GLM_API_ENDPOINT="https://open.bigmodel.cn/api/paas/v4/"

# Optional: Sentry
SENTRY_DSN=""
NEXT_PUBLIC_SENTRY_DSN=""

# Node Environment
NODE_ENV="production"
```

## Docker Configuration

### docker-compose.yml
```yaml
version: '3.8'

services:
  smartbudget-app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: smartbudget-app
    ports:
      - "3002:3000"
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - PORT=3000
    volumes:
      - ./uploads:/app/uploads
    restart: unless-stopped
    networks:
      - internal

networks:
  internal:
    external: true

volumes:
  uploads:
```

### Dockerfile
```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Create uploads directory
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

## Claude Dashboard Integration

### Components to Copy from AICEO
1. **Dashboard Layout**: AICEO/ui/components/dashboard/
2. **Claude Integration**: Pattern for API calls to GLM Gateway
3. **Chat Interface**: If needed for conversational budgeting
4. **API Route Pattern**: How AICEO calls Claude

### Adaptation for SmartBudget
- Transaction categorization via Claude
- Merchant research (existing feature)
- Budget recommendations
- Spending pattern analysis
- Financial insights generation

## Testing Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Docker build successful
- [ ] Dependencies installed

### Post-Deployment
- [ ] HTTPS working (budget.aaroncollins.info)
- [ ] Authentication flow works
- [ ] File upload (CSV/OFX) functional
- [ ] Transaction import works
- [ ] Claude AI categorization works
- [ ] Dashboard displays correctly
- [ ] Budget tracking functional
- [ ] Mobile responsive
- [ ] Error logging (Sentry) working

## Rollback Plan
1. Restore Caddy config: `cp ~/webstack/caddy/Caddyfile.backup-* ~/webstack/caddy/Caddyfile`
2. Reload Caddy: `docker exec caddy caddy reload --config /etc/caddy/Caddyfile`
3. Stop SmartBudget: `docker-compose down`
4. Investigate issues in logs

## Future Enhancements
1. **CIBC API Integration**
   - Research CIBC developer API
   - Implement bank connection
   - Handle OAuth/security

2. **Performance Optimization**
   - CDN for static assets
   - Database query optimization
   - Redis caching layer

3. **Monitoring**
   - Uptime monitoring
   - Performance metrics
   - Usage analytics

4. **Backup Strategy**
   - Automated Supabase backups
   - File upload backups
   - Disaster recovery plan

## Success Criteria
✅ Application accessible at https://budget.aaroncollins.info
✅ User can authenticate with GitHub
✅ User can upload CSV/OFX files
✅ Transactions auto-categorized with Claude AI
✅ Dashboard shows financial overview
✅ Budgets can be created and tracked
✅ No critical errors in logs
✅ SSL certificate valid
✅ Mobile responsive design works

## Notes
- Keep original repo clean (no temp files in git)
- Use Supabase for database (not local PostgreSQL)
- Copy AICEO dashboard pattern for Claude integration
- GLM Gateway provides Claude API access
- Maintain compatibility with Vercel deployment option
- Document CIBC API for future implementation
