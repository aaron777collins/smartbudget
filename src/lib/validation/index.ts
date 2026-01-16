/**
 * Centralized validation schemas for all API endpoints
 *
 * Usage in API routes:
 *
 * ```typescript
 * import { createAccountSchema } from '@/lib/validation';
 *
 * export async function POST(request: Request) {
 *   const body = await request.json();
 *   const result = createAccountSchema.safeParse(body);
 *
 *   if (!result.success) {
 *     return Response.json(
 *       { error: 'Validation failed', details: result.error.flatten() },
 *       { status: 400 }
 *     );
 *   }
 *
 *   const validatedData = result.data;
 *   // ... use validatedData
 * }
 * ```
 */

// Common schemas
export * from './common';

// Resource-specific schemas
export * from './accounts';
export * from './budgets';
export * from './categories';
export * from './dashboard';
export * from './filter-presets';
export * from './goals';
export * from './import';
export * from './insights';
export * from './jobs';
export * from './merchants';
export * from './ml';
export * from './recurring-rules';
export * from './tags';
export * from './transactions';
export * from './user';

// Validation helper function
import { ZodError, ZodSchema } from 'zod';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details: Record<string, string[]>;
  };
}

/**
 * Validates data against a Zod schema and returns a standardized result
 */
export function validate<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const result = schema.safeParse(data);

    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      error: {
        message: 'Validation failed',
        details: result.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'Validation error',
        details: { _error: [(error as Error).message] },
      },
    };
  }
}

/**
 * Validates query parameters from URL searchParams
 */
export function validateQueryParams<T>(
  schema: ZodSchema<T>,
  searchParams: URLSearchParams
): ValidationResult<T> {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return validate(schema, params);
}
