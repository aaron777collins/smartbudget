import { z } from 'zod';
import { nonEmptyStringSchema, timeframeSchema } from './common';

// POST /api/merchants/normalize - Normalize merchant name
export const normalizeMerchantSchema = z.object({
  merchantName: nonEmptyStringSchema.max(200, 'Merchant name must be 200 characters or less'),
});

// POST /api/merchants/research - Research merchant using AI
export const researchMerchantSchema = z.object({
  merchantName: nonEmptyStringSchema.max(200, 'Merchant name must be 200 characters or less'),
  transactionAmount: z.number().finite().optional(),
  transactionDate: z.string().datetime().or(z.date()).optional(),
});

// GET /api/merchants/stats - Merchant statistics
export const merchantStatsQuerySchema = z.object({
  timeframe: timeframeSchema.default('12months'),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['transactionCount', 'totalAmount', 'name']).default('totalAmount'),
});
