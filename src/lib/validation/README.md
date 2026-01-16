# API Validation System

This directory contains Zod validation schemas for all API endpoints in SmartBudget.

## Overview

All API endpoints should use these centralized schemas for input validation. This ensures:
- **Type Safety**: TypeScript types are inferred from Zod schemas
- **Consistent Error Messages**: Standardized validation error responses
- **Security**: Protection against invalid/malicious input
- **Developer Experience**: Reusable schemas reduce boilerplate

## Structure

```
src/lib/validation/
├── index.ts              # Main export file and helper functions
├── common.ts             # Shared schemas (pagination, sorting, dates, etc.)
├── accounts.ts           # Account-related schemas
├── budgets.ts            # Budget-related schemas
├── categories.ts         # Category and subcategory schemas
├── dashboard.ts          # Dashboard query parameter schemas
├── filter-presets.ts     # Filter preset schemas
├── goals.ts              # Goal-related schemas
├── import.ts             # Import/parsing schemas
├── insights.ts           # Insights query parameter schemas
├── jobs.ts               # Job queue schemas
├── merchants.ts          # Merchant-related schemas
├── ml.ts                 # Machine learning endpoint schemas
├── recurring-rules.ts    # Recurring transaction rule schemas
├── tags.ts               # Tag-related schemas
├── transactions.ts       # Transaction CRUD and query schemas
└── user.ts               # User settings and auth schemas
```

## Usage

### Basic Example

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createAccountSchema, validateQueryParams, getAccountsQuerySchema } from '@/lib/validation';

// POST endpoint with body validation
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  // Validate request body
  const result = createAccountSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    );
  }

  const validatedData = result.data;
  // ... use validatedData (fully typed!)
}

// GET endpoint with query parameter validation
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  // Validate query parameters
  const validation = validateQueryParams(getAccountsQuerySchema, searchParams);
  if (!validation.success || !validation.data) {
    return NextResponse.json(
      { error: validation.error?.message, details: validation.error?.details },
      { status: 400 }
    );
  }

  const { active, sortBy, sortOrder } = validation.data;
  // ... use validated query parameters
}
```

## Common Schemas

The `common.ts` file provides reusable building blocks:

### Pagination
```typescript
import { paginationSchema } from '@/lib/validation';

// Provides: page (number, default: 1), limit (number, 1-100, default: 20)
const mySchema = z.object({ /* ... */ }).merge(paginationSchema);
```

### Sorting
```typescript
import { sortOrderSchema } from '@/lib/validation';

// Enum: 'asc' | 'desc', default: 'desc'
const mySchema = z.object({
  sortOrder: sortOrderSchema,
});
```

### Dates
```typescript
import { dateSchema, optionalDateSchema } from '@/lib/validation';

// Accepts ISO 8601 datetime strings or Date objects
const mySchema = z.object({
  startDate: dateSchema,        // Required
  endDate: optionalDateSchema,  // Optional
});
```

### IDs
```typescript
import { idSchema } from '@/lib/validation';

// UUID validation
const mySchema = z.object({
  accountId: idSchema,
});
```

## API Route Patterns

### Pattern 1: GET with Query Parameters

```typescript
import { validateQueryParams, getTransactionsQuerySchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  // 1. Authenticate
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Validate query parameters
  const { searchParams } = new URL(request.url);
  const validation = validateQueryParams(getTransactionsQuerySchema, searchParams);
  if (!validation.success || !validation.data) {
    return NextResponse.json(
      { error: validation.error?.message, details: validation.error?.details },
      { status: 400 }
    );
  }

  // 3. Destructure validated data
  const { accountId, startDate, endDate, sortBy, sortOrder, page, limit } = validation.data;

  // 4. Build database query
  // ...
}
```

### Pattern 2: POST/PATCH with Body Validation

```typescript
import { createBudgetSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  // 1. Authenticate
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse and validate body
  const body = await request.json();
  const result = createBudgetSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    );
  }

  // 3. Use validated data
  const validatedData = result.data;

  // 4. Create resource
  const budget = await prisma.budget.create({
    data: {
      userId: session.user.id,
      ...validatedData,
    },
  });

  return NextResponse.json(budget, { status: 201 });
}
```

### Pattern 3: With Rate Limiting

```typescript
import { withExpensiveOp } from '@/lib/api-middleware';
import { categorizeTransactionSchema } from '@/lib/validation';

export const POST = withExpensiveOp(async (request: NextRequest) => {
  const body = await request.json();
  const result = categorizeTransactionSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    );
  }

  // ... expensive ML categorization operation
});
```

## Validation Helpers

### `validate<T>(schema, data)`

Generic validation function that returns a structured result:

```typescript
import { validate } from '@/lib/validation';

const result = validate(mySchema, userData);
if (!result.success) {
  // result.error.message: string
  // result.error.details: Record<string, string[]>
} else {
  // result.data: T (fully typed!)
}
```

### `validateQueryParams<T>(schema, searchParams)`

Specialized helper for URLSearchParams:

```typescript
import { validateQueryParams } from '@/lib/validation';

const { searchParams } = new URL(request.url);
const validation = validateQueryParams(myQuerySchema, searchParams);
```

## Schema Conventions

### Naming

- **GET queries**: `get{Resource}QuerySchema`
- **POST body**: `create{Resource}Schema`
- **PATCH body**: `update{Resource}Schema`
- **Special operations**: `{operation}{Resource}Schema` (e.g., `categorizeTransactionSchema`)

### Structure

All schemas should:
1. Use appropriate types from Prisma (`@prisma/client` enums)
2. Include helpful error messages
3. Set sensible defaults where applicable
4. Use `optional()` for truly optional fields
5. Apply `.default()` for fields with fallback values

### Examples

```typescript
// ✅ GOOD
export const createBudgetSchema = z.object({
  name: nonEmptyStringSchema.max(100, 'Name must be 100 characters or less'),
  amount: positiveAmountSchema,
  type: z.nativeEnum(BudgetType),
  period: z.nativeEnum(BudgetPeriod),
  startDate: dateSchema,
  endDate: optionalDateSchema,          // Truly optional
  rollover: z.boolean().default(false), // Has a default
  isActive: z.boolean().default(true),  // Has a default
});

// ❌ BAD - Missing constraints
export const createBudgetSchema = z.object({
  name: z.string(),          // Should have max length
  amount: z.number(),        // Should be positive
  type: z.string(),          // Should use enum
  startDate: z.string(),     // Should use dateSchema
});
```

## Type Inference

Zod schemas automatically generate TypeScript types:

```typescript
import { createAccountSchema } from '@/lib/validation';
import { z } from 'zod';

type CreateAccountInput = z.infer<typeof createAccountSchema>;

// CreateAccountInput is now:
// {
//   name: string;
//   institution?: string;
//   accountType: AccountType;
//   currentBalance: number;
//   // ... etc
// }
```

## Testing Validation

```typescript
import { describe, it, expect } from 'vitest';
import { createAccountSchema } from '@/lib/validation';

describe('createAccountSchema', () => {
  it('should accept valid account data', () => {
    const validData = {
      name: 'Checking Account',
      institution: 'Bank of Example',
      accountType: 'CHECKING',
      currentBalance: 1000.50,
    };

    const result = createAccountSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject negative balance', () => {
    const invalidData = {
      name: 'Checking Account',
      accountType: 'CHECKING',
      currentBalance: -100,
    };

    const result = createAccountSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
```

## Migration Guide

### Existing Endpoints Without Validation

1. **Import the appropriate schema**:
   ```typescript
   import { getMyResourceQuerySchema, createMyResourceSchema } from '@/lib/validation';
   ```

2. **Replace manual validation** with schema validation:
   ```typescript
   // Before
   if (!body.name) {
     return NextResponse.json({ error: 'Name required' }, { status: 400 });
   }
   if (!body.amount || body.amount <= 0) {
     return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
   }

   // After
   const result = createMyResourceSchema.safeParse(body);
   if (!result.success) {
     return NextResponse.json(
       { error: 'Validation failed', details: result.error.flatten() },
       { status: 400 }
     );
   }
   const validatedData = result.data;
   ```

3. **Replace manual query parsing**:
   ```typescript
   // Before
   const sortBy = searchParams.get('sortBy') || 'name';
   const sortOrder = searchParams.get('sortOrder') || 'asc';
   const page = parseInt(searchParams.get('page') || '1');

   // After
   const validation = validateQueryParams(getMyResourceQuerySchema, searchParams);
   if (!validation.success || !validation.data) {
     return NextResponse.json(
       { error: validation.error?.message, details: validation.error?.details },
       { status: 400 }
     );
   }
   const { sortBy, sortOrder, page, limit } = validation.data;
   ```

## Endpoints Currently Validated

✅ **Fully Validated** (3 routes):
- `/api/jobs/process` - Admin job processing
- `/api/feedback` - User feedback submission
- `/api/accounts` - Account listing and creation (GET, POST)
- `/api/budgets` - Budget listing (GET)
- `/api/transactions` - Transaction listing (GET)

📋 **Schemas Created** (52 routes total):
All validation schemas have been created and are ready to use. To apply to remaining endpoints, follow the Migration Guide above.

## Benefits

- **Security**: Prevents injection attacks and malformed data
- **Developer Experience**: Auto-completion and type safety
- **Consistency**: Standardized error messages across all endpoints
- **Maintainability**: Centralized validation logic
- **Documentation**: Schemas serve as API documentation

## Further Reading

- [Zod Documentation](https://zod.dev/)
- [Next.js API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)
- [Prisma Client API](https://www.prisma.io/docs/concepts/components/prisma-client)
