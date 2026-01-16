import { z } from 'zod';

/**
 * Common validation schemas used across multiple API endpoints
 */

// Pagination schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Sorting schemas
export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc');

// Common field schemas
export const idSchema = z.string().uuid('Invalid ID format');
export const dateSchema = z.string().datetime().or(z.date());
export const optionalDateSchema = dateSchema.optional();
export const currencyAmountSchema = z.number().finite();
export const positiveAmountSchema = z.number().positive().finite();
export const nonEmptyStringSchema = z.string().min(1, 'Field cannot be empty');

// Timeframe schema
export const timeframeSchema = z.enum([
  'week',
  'month',
  'quarter',
  'year',
  '30days',
  '90days',
  '12months',
  'ytd',
  'all',
]);

// Common query parameter schemas
export const booleanQuerySchema = z
  .string()
  .transform((val) => val === 'true' || val === '1')
  .or(z.boolean());

export const dateRangeSchema = z.object({
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
});

// Generic ID parameter validation
export const pathIdSchema = z.object({
  id: idSchema,
});
