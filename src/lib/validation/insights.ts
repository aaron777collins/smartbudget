import { z } from 'zod';
import { timeframeSchema, optionalDateSchema } from './common';

// GET /api/insights/anomalies - Query params
export const anomaliesQuerySchema = z.object({
  timeframe: timeframeSchema.default('30days'),
  threshold: z.coerce.number().min(1).max(5).default(2), // Standard deviations
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
});

// GET /api/insights/subscriptions - Query params
export const subscriptionsQuerySchema = z.object({
  active: z
    .string()
    .transform((val) => val === 'true' || val === '1')
    .or(z.boolean())
    .optional()
    .default(true),
  minAmount: z.coerce.number().min(0).optional(),
});

// GET /api/insights/savings-opportunities - Query params
export const savingsOpportunitiesQuerySchema = z.object({
  timeframe: timeframeSchema.default('90days'),
  categoryId: z.string().uuid().optional(),
  minSavings: z.coerce.number().min(0).optional(),
});

// GET /api/insights/spending-patterns - Query params
export const spendingPatternsQuerySchema = z.object({
  timeframe: timeframeSchema.default('12months'),
  groupBy: z.enum(['category', 'merchant', 'dayOfWeek', 'dayOfMonth']).default('category'),
  accountId: z.string().uuid().optional(),
});

// GET /api/insights/weekly-digest - Query params
export const weeklyDigestQuerySchema = z.object({
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
});
