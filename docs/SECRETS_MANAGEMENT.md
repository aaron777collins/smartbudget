# Secrets Management Guide

This guide covers best practices for managing secrets, credentials, API keys, and sensitive configuration in SmartBudget.

## Table of Contents
- [Overview](#overview)
- [Secret Types](#secret-types)
- [Environment-Based Management](#environment-based-management)
- [Secret Storage Solutions](#secret-storage-solutions)
- [Rotation Procedures](#rotation-procedures)
- [Access Control](#access-control)
- [Detection and Prevention](#detection-and-prevention)
- [Incident Response](#incident-response)
- [Best Practices](#best-practices)

---

## Overview

### What Are Secrets?

Secrets are sensitive pieces of information that must be protected from unauthorized access:
- Database credentials
- API keys and tokens
- JWT signing secrets
- OAuth client secrets
- Encryption keys
- Third-party service credentials
- Session secrets

### Why Secrets Management Matters

- **Security**: Exposed secrets can lead to data breaches
- **Compliance**: GDPR, SOC 2, and other standards require proper secret handling
- **Auditability**: Track who accessed what and when
- **Rotation**: Regular rotation reduces risk from compromised secrets
- **Separation**: Different secrets for dev/staging/production environments

---

## Secret Types

### Application Secrets

#### Database Credentials
```bash
DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"
```
- **Sensitivity**: CRITICAL
- **Rotation**: Every 90 days
- **Storage**: Encrypted secret store
- **Access**: Application servers only

#### NextAuth Secret
```bash
NEXTAUTH_SECRET="32-character-minimum-random-string"
```
- **Sensitivity**: CRITICAL
- **Rotation**: Every 90 days
- **Storage**: Encrypted secret store
- **Access**: Application servers only
- **Generation**: `openssl rand -base64 32`

#### Anthropic API Key
```bash
ANTHROPIC_API_KEY="sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxx"
```
- **Sensitivity**: HIGH
- **Rotation**: Every 180 days or on compromise
- **Storage**: Encrypted secret store
- **Access**: Application servers only
- **Cost Impact**: Yes - monitor usage

### Third-Party Service Credentials

#### Sentry DSN
```bash
SENTRY_DSN="https://public@sentry.io/project-id"
NEXT_PUBLIC_SENTRY_DSN="https://public@sentry.io/project-id"
```
- **Sensitivity**: MEDIUM (public key)
- **Rotation**: On compromise only
- **Storage**: Can be in public environment variables
- **Note**: Public DSN is safe to expose to clients

#### OAuth Provider Credentials
```bash
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxxxxxxxxxx"
```
- **Sensitivity**: HIGH
- **Rotation**: Every 180 days or on compromise
- **Storage**: Encrypted secret store
- **Access**: Application servers only

### Development vs. Production

| Secret Type | Development | Production |
|-------------|-------------|------------|
| Database Password | Can be simple | MUST be complex (32+ chars) |
| JWT Secret | Can be static | MUST be unique and rotated |
| API Keys | Can use test keys | MUST use production keys |
| Storage | `.env.local` file | Secret management service |
| Exposure Risk | Low | CRITICAL |

---

## Environment-Based Management

### Local Development

**Storage**: `.env.local` file

```bash
# .env.local (NEVER commit this file)
DATABASE_URL="postgresql://postgres:password@localhost:5432/smartbudget"
NEXTAUTH_SECRET="development-secret-at-least-32-chars"
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY="sk-ant-api03-your-key"
```

**Setup**:
```bash
# Copy template
cp .env.example .env.local

# Generate secrets
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env.local

# Edit with your values
nano .env.local
```

**Security**:
- ✅ `.env.local` is in `.gitignore`
- ✅ Use separate credentials from production
- ✅ Never share `.env.local` via email/Slack
- ⚠️ Acceptable to use simpler passwords locally
- ⚠️ Test APIs can use test mode keys

### Staging Environment

**Storage**: Platform environment variables or secret store

**Vercel**:
```bash
# Set via Vercel CLI
vercel env add DATABASE_URL staging
vercel env add NEXTAUTH_SECRET staging
vercel env add NEXTAUTH_URL staging

# Or via Vercel Dashboard:
# Project > Settings > Environment Variables > Add
```

**Security**:
- ✅ Use staging-specific credentials
- ✅ Stronger passwords than development
- ✅ Separate database from production
- ✅ Can mirror production configuration
- ⚠️ Some test data exposure is acceptable

### Production Environment

**Storage**: REQUIRED - Use dedicated secret management service

**Options**:
1. **Vercel Environment Variables** (Good for Vercel deployments)
2. **AWS Secrets Manager** (Recommended for AWS)
3. **HashiCorp Vault** (Enterprise grade)
4. **Google Secret Manager** (Good for GCP)

**Security**:
- ✅✅✅ MUST use complex passwords (32+ characters)
- ✅✅✅ MUST use unique secrets per environment
- ✅✅✅ MUST rotate regularly (90 days)
- ✅✅✅ MUST use SSL/TLS for database connections
- ✅✅✅ MUST encrypt secrets at rest
- ✅✅✅ MUST audit access to secrets
- ❌ NEVER log secrets
- ❌ NEVER commit secrets to Git
- ❌ NEVER share secrets via email/Slack

---

## Secret Storage Solutions

### Option 1: Vercel Environment Variables

**Best for**: Applications deployed to Vercel

**Setup**:
```bash
# Via CLI
vercel env add DATABASE_URL production
# Paste value when prompted

# Via Dashboard
# 1. Go to Project Settings
# 2. Navigate to Environment Variables
# 3. Add variable name and value
# 4. Select environments (Production/Preview/Development)
# 5. Save
```

**Features**:
- ✅ Encrypted at rest
- ✅ Access control via team permissions
- ✅ Preview deployment isolation
- ✅ Easy to update
- ✅ Audit log of changes
- ⚠️ Limited to Vercel deployments

**Security Level**: ✅ Good

### Option 2: AWS Secrets Manager

**Best for**: AWS deployments, enterprise applications

**Setup**:
```bash
# Install AWS CLI
aws configure

# Create secret
aws secretsmanager create-secret \
  --name smartbudget/database-url \
  --secret-string '{"DATABASE_URL":"postgresql://..."}'

# Store in environment
aws secretsmanager get-secret-value \
  --secret-id smartbudget/database-url
```

**Code Integration**:
```typescript
// src/lib/secrets.ts
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager"

const client = new SecretsManagerClient({ region: process.env.AWS_REGION })

export async function getSecret(secretName: string): Promise<string> {
  try {
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
      })
    )

    if (response.SecretString) {
      return response.SecretString
    }

    throw new Error("Secret not found")
  } catch (error) {
    console.error("Failed to retrieve secret:", secretName)
    throw error
  }
}

// Usage
export async function getDatabaseUrl(): Promise<string> {
  if (process.env.NODE_ENV === "development") {
    return process.env.DATABASE_URL!
  }

  const secret = await getSecret("smartbudget/database-url")
  const parsed = JSON.parse(secret)
  return parsed.DATABASE_URL
}
```

**Features**:
- ✅✅ Encryption at rest (KMS)
- ✅✅ Fine-grained IAM access control
- ✅✅ Automatic rotation support
- ✅✅ Versioning and rollback
- ✅✅ Audit logging via CloudTrail
- ✅✅ Cross-region replication
- ⚠️ Additional cost ($0.40/secret/month + API calls)

**Security Level**: ✅✅ Strong

### Option 3: HashiCorp Vault

**Best for**: Enterprise, multi-cloud, Kubernetes deployments

**Setup**:
```bash
# Install Vault
brew install vault  # macOS
# or download from https://www.vaultproject.io/downloads

# Start Vault (dev mode for testing)
vault server -dev

# Set environment
export VAULT_ADDR='http://127.0.0.1:8200'
export VAULT_TOKEN='root'

# Store secret
vault kv put secret/smartbudget/database \
  url="postgresql://user:pass@host:5432/db"

# Read secret
vault kv get secret/smartbudget/database
```

**Code Integration**:
```typescript
// src/lib/vault.ts
import vault from "node-vault"

const client = vault({
  apiVersion: "v1",
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN,
})

export async function getVaultSecret(path: string, key: string): Promise<string> {
  try {
    const result = await client.read(path)
    return result.data.data[key]
  } catch (error) {
    console.error("Failed to retrieve secret from Vault:", path)
    throw error
  }
}

// Usage
export async function getDatabaseUrl(): Promise<string> {
  if (process.env.NODE_ENV === "development") {
    return process.env.DATABASE_URL!
  }

  return await getVaultSecret("secret/smartbudget/database", "url")
}
```

**Features**:
- ✅✅✅ End-to-end encryption
- ✅✅✅ Dynamic secrets (generate on-demand)
- ✅✅✅ Time-based secret leasing
- ✅✅✅ Automatic rotation
- ✅✅✅ Audit logging
- ✅✅✅ Multi-cloud support
- ✅✅✅ Secret versioning
- ⚠️ Complex setup and maintenance
- ⚠️ Requires dedicated infrastructure

**Security Level**: ✅✅✅ Maximum

### Option 4: Google Cloud Secret Manager

**Best for**: Google Cloud Platform deployments

**Setup**:
```bash
# Create secret
gcloud secrets create smartbudget-database-url \
  --data-file=-  # Paste value, then Ctrl+D

# Grant access
gcloud secrets add-iam-policy-binding smartbudget-database-url \
  --member="serviceAccount:your-app@project.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

**Code Integration**:
```typescript
// src/lib/gcp-secrets.ts
import { SecretManagerServiceClient } from "@google-cloud/secret-manager"

const client = new SecretManagerServiceClient()

export async function getGCPSecret(name: string): Promise<string> {
  const projectId = process.env.GCP_PROJECT_ID
  const secretName = `projects/${projectId}/secrets/${name}/versions/latest`

  const [version] = await client.accessSecretVersion({ name: secretName })
  const payload = version.payload?.data?.toString()

  if (!payload) {
    throw new Error(`Secret ${name} not found`)
  }

  return payload
}
```

**Features**:
- ✅✅ Encryption at rest
- ✅✅ IAM-based access control
- ✅✅ Automatic rotation support
- ✅✅ Versioning
- ✅✅ Audit logging
- ✅ Generous free tier (10,000 accesses/month)

**Security Level**: ✅✅ Strong

### Comparison Matrix

| Feature | Vercel | AWS Secrets Manager | HashiCorp Vault | GCP Secret Manager |
|---------|--------|---------------------|-----------------|-------------------|
| Encryption | ✅ | ✅✅ | ✅✅✅ | ✅✅ |
| Access Control | ✅ | ✅✅ | ✅✅✅ | ✅✅ |
| Automatic Rotation | ❌ | ✅ | ✅✅ | ✅ |
| Versioning | ⚠️ | ✅ | ✅ | ✅ |
| Audit Logging | ✅ | ✅✅ | ✅✅✅ | ✅✅ |
| Setup Complexity | Easy | Medium | Hard | Medium |
| Cost | Free | Low ($0.40/secret) | Variable | Low (free tier) |
| Multi-cloud | ❌ | ❌ | ✅ | ❌ |
| Best For | Vercel apps | AWS deployments | Enterprise | GCP deployments |

---

## Rotation Procedures

### When to Rotate

**Regular Schedule**:
- 🔄 **Every 90 days** - Database passwords, JWT secrets
- 🔄 **Every 180 days** - API keys, OAuth secrets
- 🔄 **Annually** - Less sensitive configuration

**Immediate Rotation Required**:
- ❌ Secret exposed in Git history
- ❌ Secret shared via insecure channel
- ❌ Team member departure
- ❌ Security incident or breach
- ❌ Compromised server or laptop
- ❌ Suspicious activity detected

### Rotation Process

#### Automated Rotation (Recommended)

**AWS Secrets Manager**:
```bash
# Enable automatic rotation
aws secretsmanager rotate-secret \
  --secret-id smartbudget/database-url \
  --rotation-lambda-arn arn:aws:lambda:region:account:function:rotation \
  --rotation-rules AutomaticallyAfterDays=90
```

**HashiCorp Vault**:
```hcl
# Configure auto-rotation
path "database/config/smartbudget" {
  capabilities = ["create", "read", "update"]

  allowed_parameters = {
    "rotation_period" = ["90d"]
  }
}
```

#### Manual Rotation

Use the provided rotation script:
```bash
# Database credentials
./scripts/rotate-db-credentials.sh production

# JWT secret
./scripts/rotate-jwt-secret.sh production

# API keys (manual via provider dashboard)
```

**Step-by-Step Manual Process**:

1. **Generate new secret**:
   ```bash
   NEW_SECRET=$(openssl rand -base64 32)
   ```

2. **Update in secret store**:
   ```bash
   # Vercel
   vercel env rm NEXTAUTH_SECRET production
   vercel env add NEXTAUTH_SECRET production

   # AWS
   aws secretsmanager update-secret \
     --secret-id smartbudget/nextauth-secret \
     --secret-string "$NEW_SECRET"
   ```

3. **Deploy application**:
   ```bash
   # Trigger redeployment to pick up new secret
   vercel --prod
   ```

4. **Verify functionality**:
   ```bash
   # Test login, API calls, database connections
   curl https://your-app.com/api/health
   ```

5. **Document rotation**:
   ```bash
   echo "$(date): Rotated NEXTAUTH_SECRET - Operator: $(whoami)" >> rotation-log.txt
   ```

### Rotation Tracking

Create a rotation calendar:

```markdown
# Secret Rotation Schedule

| Secret | Last Rotated | Next Due | Frequency | Owner |
|--------|--------------|----------|-----------|-------|
| DATABASE_URL | 2026-01-15 | 2026-04-15 | 90 days | DevOps |
| NEXTAUTH_SECRET | 2026-01-15 | 2026-04-15 | 90 days | DevOps |
| ANTHROPIC_API_KEY | 2026-01-15 | 2026-07-15 | 180 days | Backend |
| GOOGLE_CLIENT_SECRET | 2025-12-01 | 2026-06-01 | 180 days | Backend |
```

Set calendar reminders 1 week before due date.

---

## Access Control

### Principle of Least Privilege

Only grant access to secrets that are needed:

- **Developers**: Access to development secrets only
- **DevOps**: Access to staging and production secrets
- **CI/CD**: Read-only access to specific secrets
- **Support**: No access to production secrets
- **Contractors**: Time-limited access, revoked on departure

### Team Access Matrix

| Role | Development | Staging | Production | Rotation | Audit Logs |
|------|-------------|---------|------------|----------|------------|
| Developer | Read/Write | Read | ❌ | ❌ | ❌ |
| Senior Dev | Read/Write | Read/Write | Read | ❌ | ❌ |
| DevOps | Read/Write | Read/Write | Read/Write | ✅ | ✅ |
| Security | Read | Read | Read | ✅ | ✅ |
| Support | ❌ | ❌ | ❌ | ❌ | ❌ |

### Access Audit

**Monthly Review**:
- Review who has access to production secrets
- Remove access for departed team members
- Verify access levels are appropriate
- Check for unused service accounts

**Audit Log Monitoring**:
```bash
# AWS CloudTrail - Check secret accesses
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceName,AttributeValue=smartbudget/database-url \
  --max-results 50

# Review suspicious patterns:
# - Access from unusual IPs
# - Access outside business hours
# - Bulk secret retrieval
# - Access by unfamiliar users
```

---

## Detection and Prevention

### Pre-commit Hooks

Prevent secrets from being committed to Git:

**Install git-secrets**:
```bash
# macOS
brew install git-secrets

# Initialize in repo
cd /path/to/smartbudget
git secrets --install
git secrets --register-aws
```

**Custom patterns**:
```bash
# Add SmartBudget-specific patterns
git secrets --add 'sk-ant-api03-[a-zA-Z0-9_-]{95}'  # Anthropic keys
git secrets --add 'GOCSPX-[a-zA-Z0-9_-]{28}'        # Google OAuth
git secrets --add 'postgres://[^:]+:[^@]+@'         # Database URLs
```

**GitHub Action** (`.github/workflows/secrets-scan.yml`):
```yaml
name: Secret Scanning

on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Full history

      - name: Run secret scan
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
```

### Runtime Detection

**Never log secrets**:
```typescript
// ❌ BAD - Logs entire environment
console.log(process.env)

// ❌ BAD - Logs database URL with password
console.log("Connecting to:", process.env.DATABASE_URL)

// ✅ GOOD - Logs sanitized info
const dbUrl = new URL(process.env.DATABASE_URL)
console.log("Connecting to:", dbUrl.host)
```

**Sanitize error messages**:
```typescript
// src/lib/error-sanitizer.ts
export function sanitizeError(error: Error): Error {
  let message = error.message

  // Remove database URLs
  message = message.replace(/postgres:\/\/[^:]+:[^@]+@[^\s]+/g, "postgres://***:***@***/***")

  // Remove API keys
  message = message.replace(/sk-ant-api03-[a-zA-Z0-9_-]+/g, "sk-ant-api03-***")

  // Remove JWT tokens
  message = message.replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "jwt-token-***")

  return new Error(message)
}
```

### Monitoring

**Alert on**:
- Secret access from unexpected IPs
- Bulk secret retrieval
- Failed authentication attempts
- Secret modification without approval
- Access outside business hours
- New secrets created

---

## Incident Response

### If a Secret is Exposed

**1. IMMEDIATE (Within 5 minutes)**:
```bash
# Rotate the exposed secret immediately
./scripts/rotate-db-credentials.sh production

# Or manually:
# 1. Generate new secret
NEW_SECRET=$(openssl rand -base64 32)

# 2. Update in secret store (Vercel example)
vercel env rm NEXTAUTH_SECRET production
vercel env add NEXTAUTH_SECRET production  # Paste NEW_SECRET

# 3. Trigger redeployment
vercel --prod
```

**2. ASSESS (Within 15 minutes)**:
- Determine what was exposed
- Identify exposure duration
- Check access logs for unauthorized use
- List all systems using the secret

**3. MITIGATE (Within 1 hour)**:
- Rotate ALL related secrets
- Invalidate all active sessions if auth secret exposed
- Review audit logs for suspicious activity
- Block suspicious IPs if detected
- Contact affected users if user data at risk

**4. DOCUMENT (Within 24 hours)**:
```markdown
# Security Incident Report: Secret Exposure

**Date**: 2026-01-15
**Severity**: HIGH
**Secret**: NEXTAUTH_SECRET
**Exposure Method**: Committed to Git, pushed to GitHub
**Exposure Duration**: 2 hours (10:00 - 12:00 UTC)
**Impact**: Authentication system potentially compromised

## Actions Taken:
1. Secret rotated at 12:05 UTC
2. All user sessions invalidated at 12:06 UTC
3. Git history rewritten to remove secret at 12:15 UTC
4. Force-pushed to GitHub at 12:20 UTC
5. Monitored for unauthorized access 12:00-24:00 UTC

## Findings:
- No evidence of unauthorized access
- No user data accessed
- Secret was valid for 2 hours
- 5 users were active during exposure window

## Preventive Measures:
- Installed git-secrets pre-commit hook
- Added GitHub Actions secret scanning
- Team training on secret handling scheduled
- Updated documentation with incident procedures
```

**5. PREVENT (Ongoing)**:
- Install pre-commit hooks
- Enable automated scanning
- Review access controls
- Train team on best practices

---

## Best Practices

### DO ✅

1. **Use Environment Variables**
   ```typescript
   const apiKey = process.env.ANTHROPIC_API_KEY
   ```

2. **Different Secrets Per Environment**
   ```bash
   # Development
   DATABASE_URL="postgres://localhost/dev"

   # Production
   DATABASE_URL="postgres://prod-host/prod-db?sslmode=verify-full"
   ```

3. **Generate Strong Secrets**
   ```bash
   openssl rand -base64 32
   ```

4. **Rotate Regularly**
   - Set calendar reminders
   - Use automated rotation when available
   - Document rotation in audit log

5. **Use Secret Management Services**
   - AWS Secrets Manager for AWS
   - Vercel Environment Variables for Vercel
   - HashiCorp Vault for enterprise

6. **Audit Access**
   ```bash
   # Review who accessed what and when
   aws cloudtrail lookup-events --max-results 100
   ```

7. **Encrypt at Rest**
   - All secret stores should use encryption
   - Use KMS for encryption keys

### DON'T ❌

1. **Never Commit Secrets to Git**
   ```bash
   # ❌ BAD
   DATABASE_URL="postgres://user:password@host/db"
   git add .env
   git commit -m "Add env file"
   ```

2. **Never Log Secrets**
   ```typescript
   // ❌ BAD
   console.log("API Key:", process.env.ANTHROPIC_API_KEY)

   // ✅ GOOD
   console.log("API Key configured:", !!process.env.ANTHROPIC_API_KEY)
   ```

3. **Never Hardcode Secrets**
   ```typescript
   // ❌ BAD
   const apiKey = "sk-ant-api03-xxxxx"

   // ✅ GOOD
   const apiKey = process.env.ANTHROPIC_API_KEY
   ```

4. **Never Share via Email/Slack**
   - Use secure sharing tools (1Password, LastPass)
   - Or use secret management service invitations

5. **Never Use Weak Secrets**
   ```bash
   # ❌ BAD
   PASSWORD="password123"

   # ✅ GOOD
   PASSWORD=$(openssl rand -base64 32)
   ```

6. **Never Reuse Secrets**
   - Each environment needs unique secrets
   - Each service needs unique credentials

7. **Never Skip Rotation**
   - Set up rotation schedule
   - Use automated rotation when possible
   - Document all rotations

---

## Quick Reference

### Common Commands

```bash
# Generate 32-character secret
openssl rand -base64 32

# Generate 64-character secret
openssl rand -base64 64

# Generate alphanumeric only (24 chars)
openssl rand -base64 24 | tr -dc 'a-zA-Z0-9'

# Rotate database credentials
./scripts/rotate-db-credentials.sh production

# Check for secrets in Git history
git log -S "password" --all

# Remove secret from Git history (DANGEROUS)
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env' \
  --prune-empty --tag-name-filter cat -- --all
```

### Emergency Contacts

- **Security Team**: security@smartbudget.com
- **DevOps**: devops@smartbudget.com
- **On-call**: +1-XXX-XXX-XXXX

### Related Documentation

- [Database Security](./DATABASE_SECURITY.md)
- [Audit Logging](./AUDIT_LOGGING.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Environment Variables Template](../.env.example)

---

**Last Updated**: 2026-01-15
**Maintained By**: Security & DevOps Team
**Review Frequency**: Quarterly
