# Audit Logging System

## Overview

SmartBudget includes a comprehensive audit logging system that tracks security events and data operations. This system helps with compliance (GDPR), security monitoring, and incident response.

## Features

- **Security Event Tracking**: Login attempts, account lockouts, unauthorized access, etc.
- **Data Operation Logging**: Create, read, update, delete operations on all entities
- **Context Capture**: IP addresses, user agents, timestamps
- **Flexible Querying**: Query logs by user, event type, severity, date range
- **Non-Blocking**: Logging failures don't crash the application

## Database Models

### AuditLog

Tracks general data operations (CRUD):

```typescript
{
  id: string;
  userId?: string;
  action: AuditAction; // CREATE, READ, UPDATE, DELETE, etc.
  entityType: string; // "account", "transaction", "budget", etc.
  entityId?: string;
  oldValues?: JSON; // Previous state
  newValues?: JSON; // New state
  ipAddress?: string;
  userAgent?: string;
  status: AuditStatus; // SUCCESS, FAILURE, PARTIAL
  errorMessage?: string;
  metadata?: JSON;
  createdAt: DateTime;
}
```

### SecurityEvent

Tracks security-specific events:

```typescript
{
  id: string;
  userId?: string;
  eventType: SecurityEventType; // LOGIN_SUCCESS, LOGIN_FAILURE, etc.
  severity: SecuritySeverity; // LOW, INFO, MEDIUM, HIGH, CRITICAL
  description: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
  metadata?: JSON;
  createdAt: DateTime;
}
```

## Usage

### Import the Functions

```typescript
import {
  logCreate,
  logUpdate,
  logDelete,
  logLoginSuccess,
  logLoginFailure,
  logAccountLocked,
  getAuditContext,
} from '@/lib/audit-logger';
```

### Log Data Operations

#### Create Operation

```typescript
// After creating an entity
const account = await prisma.account.create({ data: ... });

const context = getAuditContext(request);
await logCreate(
  userId,
  'account',
  account.id,
  {
    name: account.name,
    institution: account.institution,
    accountType: account.accountType,
  },
  context
);
```

#### Update Operation

```typescript
// Before and after updating
const oldAccount = await prisma.account.findUnique({ where: { id } });
const newAccount = await prisma.account.update({ where: { id }, data: ... });

const context = getAuditContext(request);
await logUpdate(
  userId,
  'account',
  id,
  {
    name: oldAccount.name,
    isActive: oldAccount.isActive,
  },
  {
    name: newAccount.name,
    isActive: newAccount.isActive,
  },
  context
);
```

#### Delete Operation

```typescript
// Before deleting
const account = await prisma.account.findUnique({ where: { id } });

await prisma.account.delete({ where: { id } });

const context = getAuditContext(request);
await logDelete(
  userId,
  'account',
  id,
  {
    name: account.name,
    institution: account.institution,
  },
  context
);
```

### Log Security Events

#### Login Events

```typescript
// Successful login (already integrated in auth.ts)
await logLoginSuccess(userId, context);

// Failed login (already integrated in auth.ts)
await logLoginFailure(email, 'Invalid password', context);

// Account locked (already integrated in auth.ts)
await logAccountLocked(userId, context);
```

#### Custom Security Events

```typescript
import { logSecurityEvent } from '@/lib/audit-logger';

await logSecurityEvent({
  userId,
  eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
  severity: 'HIGH',
  description: 'User attempted to access restricted resource',
  success: false,
  failureReason: 'Insufficient permissions',
  metadata: { resource: '/api/admin/users' },
  context,
});
```

### Extract Request Context

```typescript
import { getAuditContext } from '@/lib/audit-logger';

export async function POST(request: NextRequest) {
  const context = getAuditContext(request);
  // context now contains: { ipAddress, userAgent }

  // Use context in your logging calls
  await logCreate(userId, 'transaction', txId, data, context);
}
```

## Query Audit Logs

### Get User's Audit History

```typescript
import { getAuditLogsForUser } from '@/lib/audit-logger';

const logs = await getAuditLogsForUser(userId, 100); // Last 100 logs
```

### Get User's Security Events

```typescript
import { getSecurityEventsForUser } from '@/lib/audit-logger';

const events = await getSecurityEventsForUser(userId, 50);
```

### Get Recent High-Severity Events

```typescript
import { getRecentSecurityEvents } from '@/lib/audit-logger';

// Get last 100 events with severity >= MEDIUM
const events = await getRecentSecurityEvents(100, 'MEDIUM');
```

### Get Failed Login Attempts

```typescript
import { getFailedLoginAttempts } from '@/lib/audit-logger';

// Get failed logins from last 24 hours (default)
const failures = await getFailedLoginAttempts();

// Get failed logins since specific date
const since = new Date('2024-01-01');
const failures = await getFailedLoginAttempts(since);
```

## Event Types

### Audit Actions

- `CREATE` - Entity created
- `READ` - Entity accessed/viewed
- `UPDATE` - Entity modified
- `DELETE` - Entity deleted
- `EXPORT` - Data exported
- `IMPORT` - Data imported
- `LOGIN` - User login
- `LOGOUT` - User logout
- `PASSWORD_CHANGE` - Password changed
- `EMAIL_CHANGE` - Email changed
- `SETTINGS_UPDATE` - Settings modified
- `PERMISSION_CHANGE` - Permissions changed

### Security Event Types

- `LOGIN_SUCCESS` - Successful login
- `LOGIN_FAILURE` - Failed login attempt
- `LOGOUT` - User logout
- `PASSWORD_CHANGE` - Password changed
- `PASSWORD_RESET_REQUEST` - Password reset requested
- `PASSWORD_RESET_COMPLETE` - Password reset completed
- `EMAIL_CHANGE` - Email address changed
- `ACCOUNT_LOCKED` - Account locked due to failed attempts
- `ACCOUNT_UNLOCKED` - Account manually unlocked
- `SESSION_EXPIRED` - Session expired
- `UNAUTHORIZED_ACCESS_ATTEMPT` - Unauthorized access attempt
- `RATE_LIMIT_EXCEEDED` - Rate limit hit
- `SUSPICIOUS_ACTIVITY` - Suspicious activity detected
- `DATA_EXPORT` - Data exported by user
- `DATA_DELETION` - Data deleted by user
- `PERMISSION_ELEVATION` - User permissions elevated
- `MFA_ENABLED` - 2FA enabled
- `MFA_DISABLED` - 2FA disabled
- `MFA_BACKUP_CODES_GENERATED` - Backup codes generated

### Security Severity Levels

- `LOW` - Informational, routine events
- `INFO` - Normal operations
- `MEDIUM` - Events requiring attention
- `HIGH` - Potential security concerns
- `CRITICAL` - Serious security incidents

## Integration Points

### Already Integrated

The audit logging system is already integrated in:

1. **Authentication** (`src/auth.ts`):
   - Login success/failure
   - Account lockouts
   - Invalid credentials

2. **Accounts API** (`src/app/api/accounts/`):
   - Account creation
   - Account updates
   - Account deletion

### To Integrate

For other API endpoints, follow this pattern:

```typescript
import { logCreate, logUpdate, logDelete, getAuditContext } from '@/lib/audit-logger';

export async function POST(request: NextRequest) {
  // Your logic
  const entity = await prisma.entity.create({ ... });

  // Add audit logging
  const context = getAuditContext(request);
  await logCreate(userId, 'entity_type', entity.id, entityData, context);

  return NextResponse.json(entity);
}
```

## Best Practices

1. **Always Capture Context**: Use `getAuditContext(request)` to capture IP and user agent
2. **Log Before Deletion**: Capture entity state before deleting
3. **Don't Log Sensitive Data**: Never log passwords, tokens, or full credit card numbers
4. **Use Appropriate Severity**: Match severity to event impact
5. **Provide Descriptions**: Write clear, actionable descriptions
6. **Include Metadata**: Add relevant context in metadata field
7. **Handle Failures**: Logging failures shouldn't break your API

## Security Considerations

- Audit logs are append-only (no updates or deletes via API)
- Sensitive fields (passwords) are never logged
- IP addresses and user agents help track suspicious activity
- Failed login attempts are logged even without userId
- All timestamps are UTC

## Compliance

This audit logging system supports:

- **GDPR Article 30**: Records of processing activities
- **GDPR Article 33**: Data breach detection and notification
- **GDPR Article 15**: Right of access (users can see their audit logs)
- **SOC 2**: Access controls and monitoring
- **ISO 27001**: Information security logging

## Performance

- Logging is asynchronous and non-blocking
- Failures are caught and logged to console
- Database indexes optimize query performance
- Consider archiving old logs (>1 year) to separate storage

## Monitoring

Set up alerts for:

- High severity security events
- Multiple failed login attempts from same IP
- Unauthorized access attempts
- Rate limit violations
- Unusual data export/deletion patterns

## Future Enhancements

Potential improvements:

1. Log retention policies (auto-archive after 1 year)
2. Admin dashboard for viewing logs
3. Real-time alerting system
4. Log export functionality (for compliance)
5. Log integrity verification (checksums/signing)
6. Integration with SIEM tools
7. Anomaly detection for suspicious patterns

## Troubleshooting

### Logs Not Appearing

1. Check database connection
2. Verify migration ran successfully: `npx prisma migrate deploy`
3. Check for errors in console
4. Verify Prisma client is regenerated: `npx prisma generate`

### Performance Issues

1. Check database indexes are created
2. Consider log archiving for old data
3. Add additional indexes for common queries
4. Use pagination for large result sets

## Example Queries

### Find All Failed Login Attempts for User

```typescript
const events = await prisma.securityEvent.findMany({
  where: {
    userId: 'user-id',
    eventType: 'LOGIN_FAILURE',
  },
  orderBy: { createdAt: 'desc' },
});
```

### Find All Data Exports in Last 30 Days

```typescript
const exports = await prisma.auditLog.findMany({
  where: {
    action: 'EXPORT',
    createdAt: {
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  },
  orderBy: { createdAt: 'desc' },
});
```

### Find High Severity Events

```typescript
const critical = await prisma.securityEvent.findMany({
  where: {
    severity: {
      in: ['HIGH', 'CRITICAL'],
    },
  },
  orderBy: { createdAt: 'desc' },
  take: 50,
});
```

## Conclusion

The audit logging system provides comprehensive tracking of security events and data operations. It's designed to be easy to use, performant, and compliant with modern security standards.

For questions or issues, refer to the main security documentation or create an issue in the repository.
