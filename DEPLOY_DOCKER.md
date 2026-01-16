# SmartBudget Docker Deployment

## Objective
Deploy the updated SmartBudget application (with all Ralph CSS/auth/security updates) to budget.aaroncollins.info via Docker with zero-downtime deployment.

## Current State
- Docker container running: smartbudget-app (port 3002 → 3000)
- Live at: budget.aaroncollins.info
- Updates completed: CSS (Tailwind), username auth (aaron7c), security features

## Deployment Tasks

### Block 1: Pre-Deployment Verification (CRITICAL)
**Priority: P0 - Must complete first**

**Task 1.1: Verify .env file exists and contains required secrets**
- File: `.env`
- Must contain: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
- Action: Read and verify (do NOT display secrets)

**Task 1.2: Verify Prisma migrations are current**
- Check: `prisma/migrations` directory
- Action: Ensure latest migration includes username field
- Verify: Migration was already applied by Ralph

**Task 1.3: Run database backup before deployment**
- Action: `docker exec smartbudget-app npx prisma db pull` to snapshot schema
- Or: Manual pg_dump if database is external

### Block 2: Build Updated Docker Image (CRITICAL)
**Priority: P0 - Core deployment**

**Task 2.1: Stop current container gracefully**
- Command: `docker-compose down`
- Working directory: `/home/ubuntu/repos/smartbudget`
- Verify: Container stops without errors

**Task 2.2: Build new Docker image**
- Command: `docker-compose build --no-cache`
- This will:
  - Install dependencies
  - Generate Prisma client with username field
  - Build Next.js with new Tailwind CSS
  - Create production image
- Expected time: 3-5 minutes
- Verify: Build completes without errors

**Task 2.3: Run database migrations**
- Before starting container, ensure migrations are ready
- Migrations should already be in `prisma/migrations/` from Ralph
- Will be applied on container startup

### Block 3: Deploy New Container (CRITICAL)
**Priority: P0 - Final deployment**

**Task 3.1: Start new container**
- Command: `docker-compose up -d`
- This will:
  - Start new container with updated code
  - Map port 3002 → 3000
  - Apply .env variables
  - Run Prisma migrations automatically
  - Start health checks

**Task 3.2: Monitor container startup**
- Command: `docker logs -f smartbudget-app`
- Watch for:
  - "✓ Ready" message from Next.js
  - No Prisma migration errors
  - No build errors
  - Port 3000 listening
- Expected time: 30-60 seconds

**Task 3.3: Verify health check passes**
- Command: `docker ps` - check health status
- Should show: "healthy" after 40s startup period
- If unhealthy: Check logs for errors

### Block 4: Post-Deployment Testing (CRITICAL)
**Priority: P0 - Verify everything works**

**Task 4.1: Test local container access**
- Command: `curl -s http://localhost:3002`
- Should return: HTML content (Next.js app)
- Verify: No 500 errors

**Task 4.2: Test CSS rendering**
- Command: `curl -s http://localhost:3002 | grep -i "tailwind\|stylesheet"`
- Verify: CSS files are referenced
- Visual check: Load in browser, verify Tailwind classes work

**Task 4.3: Test authentication flow**
- Navigate to: http://localhost:3002
- Verify: Login form shows "Username" (not Email)
- Test login: username=aaron7c, password=KingOfKings12345!
- Expected: Successful login, redirects to dashboard

**Task 4.4: Test database connection**
- Login with aaron7c
- Verify: Dashboard loads with user data
- Check: No database connection errors in logs

**Task 4.5: Test live site (budget.aaroncollins.info)**
- Command: `curl -s http://budget.aaroncollins.info`
- Verify: Site responds (nginx should proxy to port 3002)
- Test: Full login flow on live site
- Verify: All CSS styles rendering

### Block 5: Rollback Plan (IF NEEDED)
**Priority: P1 - Only if deployment fails**

**Task 5.1: If deployment fails, rollback**
- Keep previous image: Tag before building: `docker tag smartbudget-smartbudget-app smartbudget-backup`
- Rollback: `docker-compose down && docker run -d --name smartbudget-app smartbudget-backup`
- Restore: Previous container with old code

**Task 5.2: Investigate failure**
- Check logs: `docker logs smartbudget-app`
- Common issues:
  - Prisma migration failure (username field)
  - Missing .env variables
  - Build errors from Tailwind/PostCSS
  - Database connection issues

## Success Criteria
- ✅ New container running and healthy
- ✅ CSS (Tailwind) rendering correctly
- ✅ Login works with username (aaron7c)
- ✅ Dashboard loads without errors
- ✅ budget.aaroncollins.info accessible and functional
- ✅ No errors in docker logs

## Estimated Time
- Total: 5-10 minutes
- Build: 3-5 minutes
- Deploy + test: 2-5 minutes

## Notes
- Database migrations were already applied by Ralph during development
- Tailwind config and PostCSS setup already complete
- Default user (aaron7c) already seeded in database
- Zero downtime: New container replaces old one smoothly
