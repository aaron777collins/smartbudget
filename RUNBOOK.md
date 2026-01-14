# SmartBudget Operations Runbook

## Deployment Information

- **Application URL**: https://budget.aaroncollins.info
- **Container Name**: smartbudget-app
- **Docker Network**: internal
- **Host Port**: 3002 → Container Port: 3000
- **Base Directory**: ~/repos/smartbudget
- **Uploads Directory**: ~/repos/smartbudget/uploads

## Daily Operations

### View Logs

```bash
# View recent logs
docker logs smartbudget-app

# View last 50 lines
docker logs smartbudget-app --tail 50

# Follow logs in real-time
docker logs -f smartbudget-app

# View logs with timestamps
docker logs -t smartbudget-app
```

### Restart Application

```bash
cd ~/repos/smartbudget

# Restart container (graceful)
docker-compose restart smartbudget-app

# Stop and start (full restart)
docker-compose stop smartbudget-app
docker-compose start smartbudget-app

# Restart with rebuild (after code changes)
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Check Application Status

```bash
# Check container status
docker ps | grep smartbudget

# Check health endpoint
curl https://budget.aaroncollins.info/api/health | jq .

# Check container resource usage
docker stats smartbudget-app --no-stream

# Check container logs for errors
docker logs smartbudget-app --tail 100 | grep -i error
```

### Update Application

```bash
cd ~/repos/smartbudget

# Pull latest code
git pull origin master

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Verify deployment
docker logs smartbudget-app --tail 50
curl -I https://budget.aaroncollins.info
```

### Caddy Operations

```bash
cd ~/webstack

# Reload Caddy configuration (after Caddyfile changes)
docker exec caddy caddy reload --config /etc/caddy/Caddyfile

# Validate Caddyfile syntax
docker exec caddy caddy validate --config /etc/caddy/Caddyfile

# View Caddy logs
docker logs caddy --tail 100

# Check TLS certificates
docker exec caddy caddy list-modules | grep tls
```

## Backup Procedures

### Backup Configuration

```bash
# Backup Caddyfile
cp ~/webstack/caddy/Caddyfile ~/webstack/caddy/Caddyfile.backup-$(date +%Y%m%d-%H%M%S)

# Backup .env file
cp ~/repos/smartbudget/.env ~/repos/smartbudget/.env.backup-$(date +%Y%m%d-%H%M%S)

# Backup uploads directory
tar -czf ~/backups/smartbudget-uploads-$(date +%Y%m%d).tar.gz ~/repos/smartbudget/uploads/
```

### Database Backups

```bash
# Supabase handles automated backups
# Manual backup: Use Supabase Dashboard → Database → Backups

# Export database schema
cd ~/repos/smartbudget
npx prisma db pull
```

## Rollback Procedure

### 1. Stop SmartBudget

```bash
cd ~/repos/smartbudget
docker-compose down
```

### 2. Restore Caddy Configuration

```bash
# List backups
ls -lh ~/webstack/caddy/Caddyfile.backup-*

# Restore specific backup
cp ~/webstack/caddy/Caddyfile.backup-20260114-171243 ~/webstack/caddy/Caddyfile

# Reload Caddy
cd ~/webstack
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

### 3. Verify Rollback

```bash
# Check if budget.aaroncollins.info returns 502 or 404
curl -I https://budget.aaroncollins.info

# Should return 502 Bad Gateway (container not running)
```

### 4. Re-deploy (if needed)

```bash
cd ~/repos/smartbudget
docker-compose up -d
```

## Troubleshooting

### Application Won't Start

```bash
# Check container logs for errors
docker logs smartbudget-app

# Check if port 3002 is already in use
sudo lsof -i :3002

# Check if internal network exists
docker network ls | grep internal

# Verify .env file exists
ls -lh ~/repos/smartbudget/.env

# Check Docker image exists
docker images | grep smartbudget
```

### Database Connection Issues

```bash
# Verify DATABASE_URL in .env
cat ~/repos/smartbudget/.env | grep DATABASE_URL

# Test database connection (if password configured)
cd ~/repos/smartbudget
npx prisma db push --skip-generate

# Check Supabase project status
supabase projects list
```

### HTTPS Certificate Issues

```bash
# Check certificate status
curl -vI https://budget.aaroncollins.info 2>&1 | grep "SSL certificate"

# View Caddy TLS management
docker exec caddy caddy list-modules | grep tls

# Force certificate renewal (if expired)
cd ~/webstack
docker-compose restart caddy
```

### High Memory Usage

```bash
# Check container memory
docker stats smartbudget-app --no-stream

# If memory > 500MB, restart container
docker-compose restart smartbudget-app

# Check for memory leaks in logs
docker logs smartbudget-app | grep -i "memory\|heap"
```

### Uploads Directory Full

```bash
# Check uploads directory size
du -sh ~/repos/smartbudget/uploads/

# Clean up old files (older than 30 days)
find ~/repos/smartbudget/uploads/ -type f -mtime +30 -delete

# Archive old uploads
tar -czf ~/backups/uploads-archive-$(date +%Y%m%d).tar.gz ~/repos/smartbudget/uploads/
rm -rf ~/repos/smartbudget/uploads/csv/* ~/repos/smartbudget/uploads/ofx/*
```

## Monitoring Checklist

### Daily Checks
- [ ] Application accessible at https://budget.aaroncollins.info
- [ ] Health endpoint returns 200 or 503 (503 OK if database not configured)
- [ ] No critical errors in container logs
- [ ] Container status: Up and healthy

### Weekly Checks
- [ ] Check disk usage of uploads volume: `du -sh ~/repos/smartbudget/uploads/`
- [ ] Review container logs for anomalies: `docker logs smartbudget-app --tail 500`
- [ ] Check container resource usage: `docker stats smartbudget-app --no-stream`
- [ ] Verify TLS certificate not expiring soon: `curl -vI https://budget.aaroncollins.info 2>&1 | grep "expire date"`

### Monthly Checks
- [ ] Update dependencies: `npm update` (test locally first)
- [ ] Review and rotate NEXTAUTH_SECRET if needed
- [ ] Check for security updates: `npm audit`
- [ ] Review Sentry error reports (if configured)
- [ ] Test backup restoration procedure

## Security Contacts

- **Sentry**: Error tracking (if SENTRY_DSN configured)
- **Supabase**: Database hosting
- **GitHub**: OAuth provider
- **Anthropic**: Claude AI API
- **Let's Encrypt**: TLS certificates (via Caddy)

## Emergency Procedures

### Complete Service Down

1. Check container status: `docker ps | grep smartbudget`
2. Check logs: `docker logs smartbudget-app --tail 100`
3. Restart container: `docker-compose restart smartbudget-app`
4. If restart fails, rebuild: `docker-compose down && docker-compose build && docker-compose up -d`
5. Check Caddy status: `docker ps | grep caddy`
6. Verify network: `docker network inspect internal`

### Database Connection Lost

1. Check Supabase status: `supabase projects list`
2. Verify .env DATABASE_URL is correct
3. Test connection: `npx prisma db push --skip-generate`
4. Restart container: `docker-compose restart smartbudget-app`
5. Contact: Supabase support if database is down

### Certificate Expired

1. Restart Caddy: `docker restart caddy`
2. Check certificate renewal: `docker logs caddy | grep -i "certificate"`
3. Verify DNS: `nslookup budget.aaroncollins.info`
4. Manual renewal: Caddy auto-renews, restart should trigger renewal

## Performance Optimization

### Expected Performance Metrics
- Cold start: < 5 seconds
- API response time: < 500ms for most endpoints
- Dashboard load: < 2 seconds with caching
- Memory usage: 200-400MB typical, 512MB max
- CPU usage: < 50% idle

### If Performance Degrades
1. Check container resources: `docker stats smartbudget-app`
2. Review slow queries in logs
3. Clear Next.js cache: Rebuild container
4. Check database query performance (when DB connected)
5. Consider adding Redis caching (Task 11.3)

## Additional Resources

- **Deployment Plan**: ~/repos/smartbudget/SMARTBUDGET_DEPLOYMENT_PLAN.md
- **Progress Tracking**: ~/repos/smartbudget/SMARTBUDGET_DEPLOYMENT_PLAN_PROGRESS.md
- **Caddy Documentation**: https://caddyserver.com/docs/
- **Next.js Documentation**: https://nextjs.org/docs
- **Supabase Documentation**: https://supabase.com/docs
- **Docker Documentation**: https://docs.docker.com/

## Notes

- Application is currently deployed and accessible but database connection is pending password configuration
- Once database password is provided, run migrations: `npx prisma migrate deploy`
- GitHub OAuth callback URL needs to be added: https://budget.aaroncollins.info/api/auth/callback/github
- Consider creating dedicated Supabase project instead of using shared returnzie database
