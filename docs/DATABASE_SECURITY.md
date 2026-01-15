# Database Security Guide

This guide covers security best practices for database connections, credential management, and data protection in SmartBudget.

## Table of Contents
- [SSL/TLS Encryption](#ssltls-encryption)
- [Database Credentials](#database-credentials)
- [Connection Security](#connection-security)
- [Access Control](#access-control)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## SSL/TLS Encryption

### Overview

SmartBudget **requires** SSL/TLS encryption for all production database connections. This ensures that data transmitted between the application and database is encrypted and protected from interception.

### SSL Modes

PostgreSQL supports several SSL modes with increasing levels of security:

| SSL Mode | Security Level | Description | Use Case |
|----------|---------------|-------------|----------|
| `disable` | ❌ None | No encryption | **Never use in production** - Development only |
| `require` | ✅ Basic | Encryption required, skip cert verification | Minimum for production |
| `verify-ca` | ✅✅ Strong | Encryption + verify CA certificate | Recommended for production |
| `verify-full` | ✅✅✅ Maximum | Encryption + verify CA + hostname | Best for production |

### Configuration

#### Development Environment

For local development, SSL is **optional** (but recommended to match production):

```bash
# .env.local
DATABASE_URL="postgresql://postgres:password@localhost:5432/smartbudget"
```

#### Production Environment

For production, SSL is **REQUIRED**. Choose your SSL mode:

##### Option 1: Basic SSL (Minimum Requirement)
```bash
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
```

✅ **Pros**: Simple, works with most managed databases
⚠️ **Cons**: Doesn't verify server certificate (vulnerable to MITM)

##### Option 2: CA Verification (Recommended)
```bash
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=verify-ca&sslrootcert=/path/to/ca-cert.pem"
```

✅ **Pros**: Verifies database server certificate against trusted CA
⚠️ **Cons**: Requires CA certificate file

##### Option 3: Full Verification (Most Secure)
```bash
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=verify-full&sslrootcert=/path/to/ca-cert.pem"
```

✅ **Pros**: Maximum security - verifies certificate and hostname
⚠️ **Cons**: Requires CA certificate and exact hostname match

##### Option 4: Mutual TLS (Client Certificate Authentication)
```bash
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=verify-full&sslcert=/path/to/client-cert.pem&sslkey=/path/to/client-key.pem&sslrootcert=/path/to/ca-cert.pem"
```

✅ **Pros**: Highest security - mutual authentication
⚠️ **Cons**: Complex setup, requires client certificates

### Managed Database Providers

Most managed database providers **include SSL by default**:

#### Neon
```bash
# SSL automatically included in connection string
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/database?sslmode=require"
```

#### Supabase
```bash
# SSL automatically configured
DATABASE_URL="postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require"
```

#### Railway
```bash
# SSL required by default
DATABASE_URL="postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway?sslmode=require"
```

#### Heroku Postgres
```bash
# SSL automatically enforced
DATABASE_URL="postgres://user:password@ec2-xxx.compute-1.amazonaws.com:5432/database?sslmode=require"
```

#### AWS RDS
```bash
# Download CA certificate from AWS
# https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL.html
DATABASE_URL="postgresql://user:password@database.xxx.region.rds.amazonaws.com:5432/database?sslmode=verify-ca&sslrootcert=/path/to/rds-ca-bundle.pem"
```

### Validation

SmartBudget includes automatic SSL validation in `src/lib/prisma.ts`:

```typescript
// Production environments MUST use SSL
if (process.env.NODE_ENV === "production" && !isLocalhost) {
  if (!databaseUrl.includes("sslmode=")) {
    throw new Error("Database connection MUST use SSL/TLS in production")
  }
}
```

This validation:
- ✅ **Enforces SSL in production** - Application fails to start without SSL
- ✅ **Allows development flexibility** - No SSL required for local development
- ✅ **Provides clear error messages** - Tells you exactly how to fix configuration
- ✅ **Warns about weak SSL modes** - Suggests using stronger verification

### Certificate Management

#### Obtaining CA Certificates

**Managed Providers**: Usually included automatically, no action needed.

**Self-hosted PostgreSQL**:
1. Generate CA certificate:
   ```bash
   openssl req -new -x509 -days 365 -nodes -text \
     -out server.crt -keyout server.key \
     -subj "/CN=dbhost.example.com"
   ```

2. Configure PostgreSQL to use SSL:
   ```conf
   # postgresql.conf
   ssl = on
   ssl_cert_file = '/path/to/server.crt'
   ssl_key_file = '/path/to/server.key'
   ssl_ca_file = '/path/to/root.crt'
   ```

3. Provide CA certificate to application:
   ```bash
   DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=verify-ca&sslrootcert=/app/certs/ca.pem"
   ```

#### Certificate Storage

**Development**:
- Store in `certs/` folder (add to `.gitignore`)
- Use relative paths: `sslrootcert=./certs/ca.pem`

**Production**:
- Use environment variables for certificate paths
- Store certificates in secure volume/secret manager
- Never commit certificates to Git

**Example with Docker**:
```dockerfile
# Mount certificates as volume
docker run -v /secure/certs:/app/certs \
  -e DATABASE_URL="postgresql://...?sslrootcert=/app/certs/ca.pem" \
  smartbudget
```

**Example with Kubernetes**:
```yaml
# Store as secret
apiVersion: v1
kind: Secret
metadata:
  name: db-certs
type: Opaque
data:
  ca.pem: <base64-encoded-cert>
---
# Mount in pod
volumes:
  - name: db-certs
    secret:
      secretName: db-certs
volumeMounts:
  - name: db-certs
    mountPath: /app/certs
    readOnly: true
```

---

## Database Credentials

### Password Requirements

Database passwords **MUST**:
- ✅ Be at least **20 characters long** (32+ recommended)
- ✅ Include uppercase, lowercase, numbers, and symbols
- ✅ Be generated randomly (not based on dictionary words)
- ✅ Be unique (not reused from other services)
- ✅ Be stored securely (never in code or committed to Git)

### Password Generation

**Recommended method**:
```bash
# Generate 32-character random password
openssl rand -base64 32
# Output: jX9bK2mP4nQ8rT6vY1wZ3aB5cD7eF0gH1iJ3kL5mN7o=

# Generate 24-character alphanumeric password
openssl rand -base64 24 | tr -dc 'a-zA-Z0-9'
# Output: X9bK2mP4nQ8rT6vY1wZ3aB5c
```

**Alternative methods**:
```bash
# Using pwgen (install: apt-get install pwgen)
pwgen -s 32 1

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Credential Rotation

**Rotation Schedule**:
- 🔄 **Every 90 days** - Regular rotation (recommended)
- 🔄 **Every 30 days** - High-security environments
- 🔄 **Immediately** - After security incident or employee departure

**Rotation Process**:

1. **Generate new password**:
   ```bash
   NEW_PASSWORD=$(openssl rand -base64 32)
   echo "New password: $NEW_PASSWORD"
   ```

2. **Update database user**:
   ```sql
   -- Connect as superuser
   ALTER USER smartbudget_user PASSWORD 'new_password_here';
   ```

3. **Update environment variable**:
   ```bash
   # Update DATABASE_URL with new password
   # Deploy application with new credentials
   ```

4. **Verify connection**:
   ```bash
   # Test database connection
   npm run db:status
   ```

5. **Update backup systems**:
   - Update backup scripts
   - Update monitoring tools
   - Update documentation

**Downtime-free rotation** (for high-availability):
1. Create new database user with same permissions
2. Update 50% of app instances to use new user
3. Monitor for errors
4. Update remaining instances
5. Delete old user after 24 hours

### Secrets Management

**❌ NEVER**:
- Hardcode credentials in source code
- Commit `.env` files to Git
- Share credentials via email/Slack
- Use weak or default passwords
- Reuse passwords across environments

**✅ ALWAYS**:
- Use environment variables
- Store production credentials in secure vault
- Use different credentials per environment
- Limit credential access to essential team members
- Audit credential access logs

**Recommended Tools**:

| Tool | Use Case | Security Level |
|------|----------|----------------|
| `.env` files | Local development | ⚠️ Basic |
| Vercel Environment Variables | Vercel deployments | ✅ Good |
| AWS Secrets Manager | AWS deployments | ✅✅ Strong |
| HashiCorp Vault | Enterprise | ✅✅✅ Maximum |
| 1Password/LastPass | Team sharing | ✅ Good |

**Example: AWS Secrets Manager**:
```typescript
// src/lib/secrets.ts
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager"

async function getDatabaseUrl() {
  if (process.env.NODE_ENV === "development") {
    return process.env.DATABASE_URL
  }

  const client = new SecretsManagerClient({ region: "us-east-1" })
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: "smartbudget/database-url" })
  )
  return JSON.parse(response.SecretString!).DATABASE_URL
}
```

---

## Connection Security

### Connection Pooling

SmartBudget uses Prisma's connection pooling with these settings:

```typescript
// Default Prisma connection pool
{
  connection_limit: 10,        // Max connections per instance
  pool_timeout: 10,            // Seconds to wait for connection
  connect_timeout: 10          // Seconds to wait for initial connection
}
```

**Tuning for Production**:

Add to DATABASE_URL:
```bash
?connection_limit=20&pool_timeout=10&connect_timeout=5
```

**Recommendations by deployment size**:

| Deployment | Connection Limit | Notes |
|------------|-----------------|-------|
| Single instance | 10 | Default is fine |
| 2-5 instances | 10-15 per instance | Monitor database max_connections |
| 5-10 instances | 5-10 per instance | Total < database max_connections |
| 10+ instances | Use PgBouncer | Connection pooler required |

**Database max_connections check**:
```sql
SHOW max_connections;
-- Ensure: (instances × connection_limit) < max_connections
```

### Network Security

**Firewall Rules**:
- ✅ **Allow**: Application server IPs only
- ❌ **Deny**: All other IPs, especially 0.0.0.0/0
- ✅ **Use**: VPC/private network when possible

**Example: AWS Security Group**:
```hcl
# Allow only app servers
ingress {
  from_port   = 5432
  to_port     = 5432
  protocol    = "tcp"
  cidr_blocks = ["10.0.1.0/24"]  # App subnet only
}
```

**Example: Neon IP allowlist**:
```bash
# Neon Dashboard > Settings > IP Allow
# Add your app server IPs:
203.0.113.10
203.0.113.11
```

### Read Replicas

For read-heavy workloads, use read replicas:

```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client"

// Write (primary)
export const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL }
  }
})

// Read (replica)
export const prismaRead = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_READ_URL }
  }
})

// Usage
await prisma.transaction.create({ data: {...} })  // Write to primary
await prismaRead.transaction.findMany({...})      // Read from replica
```

---

## Access Control

### Database User Permissions

**Application User** (minimum required permissions):
```sql
-- Create application user
CREATE USER smartbudget_app WITH PASSWORD 'strong_password_here';

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO smartbudget_app;

-- Grant table permissions (read/write only, no DDL)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO smartbudget_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO smartbudget_app;

-- Future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO smartbudget_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO smartbudget_app;
```

**Migration User** (for schema changes):
```sql
-- Create migration user (used by CI/CD only)
CREATE USER smartbudget_migration WITH PASSWORD 'strong_password_here';

-- Grant schema ownership
GRANT ALL PRIVILEGES ON SCHEMA public TO smartbudget_migration;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO smartbudget_migration;
```

**Read-Only User** (for analytics/reporting):
```sql
-- Create read-only user
CREATE USER smartbudget_readonly WITH PASSWORD 'strong_password_here';

-- Grant read access only
GRANT USAGE ON SCHEMA public TO smartbudget_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO smartbudget_readonly;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO smartbudget_readonly;
```

### Row-Level Security (RLS)

PostgreSQL Row-Level Security ensures users can only access their own data:

```sql
-- Enable RLS on transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own transactions
CREATE POLICY user_transactions ON transactions
  FOR ALL
  USING (user_id = current_setting('app.user_id')::uuid);

-- In application, set user context before queries
SET app.user_id = 'user-uuid-here';
```

**Note**: SmartBudget currently handles row-level security at the application level via middleware. Database-level RLS provides defense-in-depth.

---

## Monitoring

### Connection Monitoring

**Key Metrics**:
- Active connections
- Idle connections
- Connection wait time
- Connection errors
- Query duration

**PostgreSQL Queries**:
```sql
-- Active connections by state
SELECT state, COUNT(*)
FROM pg_stat_activity
WHERE datname = 'smartbudget'
GROUP BY state;

-- Long-running queries
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '5 seconds'
ORDER BY duration DESC;

-- Connection pool usage
SELECT COUNT(*) as total_connections,
       COUNT(*) FILTER (WHERE state = 'active') as active,
       COUNT(*) FILTER (WHERE state = 'idle') as idle
FROM pg_stat_activity
WHERE datname = 'smartbudget';
```

### SSL Verification

**Check active connections**:
```sql
SELECT datname, usename, ssl, client_addr
FROM pg_stat_ssl
JOIN pg_stat_activity ON pg_stat_ssl.pid = pg_stat_activity.pid
WHERE datname = 'smartbudget';
```

Expected output:
```
 datname    | usename          | ssl  | client_addr
------------+------------------+------+-------------
 smartbudget| smartbudget_app  | t    | 203.0.113.10
```

**Verify SSL is enforced**:
```sql
SELECT name, setting
FROM pg_settings
WHERE name IN ('ssl', 'ssl_cert_file', 'ssl_key_file');
```

### Alerting

**Set up alerts for**:
- ❌ SSL connection failures
- ❌ Connection pool exhaustion
- ❌ Unauthorized access attempts
- ❌ Unusual query patterns
- ❌ Database credential changes

**Example: CloudWatch Alarm (AWS RDS)**:
```yaml
DBConnections:
  AlarmDescription: "Database connection count too high"
  Threshold: 80
  ComparisonOperator: GreaterThanThreshold
  EvaluationPeriods: 2
  MetricName: DatabaseConnections
```

---

## Troubleshooting

### SSL Connection Failures

**Error**: `SSL connection has been closed unexpectedly`

**Solutions**:
1. Verify SSL is enabled on database server
2. Check certificate validity: `openssl x509 -in server.crt -text -noout`
3. Try lower SSL mode: `sslmode=require` instead of `verify-full`
4. Check firewall allows SSL port (usually 5432)

**Error**: `certificate verify failed`

**Solutions**:
1. Provide CA certificate: `sslrootcert=/path/to/ca.pem`
2. Verify certificate chain is complete
3. Check certificate hasn't expired
4. Use `sslmode=require` to skip verification (temporary)

**Error**: `SSL is not enabled on the server`

**Solutions**:
1. Enable SSL in `postgresql.conf`: `ssl = on`
2. Provide server certificate and key
3. Restart PostgreSQL server
4. For local dev, remove `sslmode=` from connection string

### Connection Pool Issues

**Error**: `Timed out fetching a new connection from the connection pool`

**Solutions**:
1. Increase `connection_limit`: `?connection_limit=20`
2. Increase `pool_timeout`: `?pool_timeout=30`
3. Check for connection leaks (connections not properly released)
4. Review long-running queries blocking connections

**Error**: `too many connections for role`

**Solutions**:
1. Reduce `connection_limit` per app instance
2. Increase database `max_connections`
3. Implement connection pooler (PgBouncer)
4. Scale database vertically

### Performance Issues

**Slow queries**:
1. Check connection pool status
2. Review query execution plans: `EXPLAIN ANALYZE`
3. Add database indexes
4. Check SSL overhead (usually < 5%)

**High connection count**:
1. Implement connection pooler (PgBouncer, pgPool)
2. Review connection lifecycle
3. Ensure connections are properly closed
4. Use read replicas for read-heavy workloads

---

## Checklist

### Development Setup
- [ ] PostgreSQL installed locally
- [ ] Database created: `smartbudget`
- [ ] `.env.local` configured with DATABASE_URL
- [ ] Migrations applied: `npx prisma migrate dev`
- [ ] Database seeded: `npm run db:seed`

### Production Deployment
- [ ] SSL/TLS enabled (`sslmode=require` minimum)
- [ ] Strong database password (32+ characters)
- [ ] Database not publicly accessible
- [ ] Firewall rules restrict access to app servers only
- [ ] Connection pooling configured appropriately
- [ ] Database user has minimum required permissions
- [ ] SSL certificates stored securely (if using verify-ca/verify-full)
- [ ] Monitoring and alerting configured
- [ ] Backup encryption enabled
- [ ] Credential rotation schedule documented

### Security Validation
- [ ] SSL validation passes in prisma.ts
- [ ] No credentials in Git history: `git log -S "password" --all`
- [ ] `.env` files in `.gitignore`
- [ ] Database accessible only from app servers
- [ ] Connection strings don't include passwords in logs
- [ ] SSL certificate valid and not expired
- [ ] Database user permissions follow least privilege
- [ ] Connection pool limits set appropriately

---

## Related Documentation

- [Audit Logging](./AUDIT_LOGGING.md) - Security event tracking
- [Environment Variables](./.env.example) - Configuration template
- [Deployment Guide](./DEPLOYMENT.md) - Production setup
- [Prisma Documentation](https://www.prisma.io/docs/concepts/database-connectors/postgresql) - Database connector

---

## References

- [PostgreSQL SSL Documentation](https://www.postgresql.org/docs/current/ssl-tcp.html)
- [Prisma Connection Management](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [OWASP Database Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html)
- [Neon SSL/TLS Configuration](https://neon.tech/docs/connect/connection-security)

---

**Last Updated**: 2026-01-15
**Maintained By**: Security Team
