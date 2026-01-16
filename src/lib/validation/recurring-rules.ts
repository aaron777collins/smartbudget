import { z } from 'zod';
import { Frequency, TransactionType } from '@prisma/client';
import {
  currencyAmountSchema,
  nonEmptyStringSchema,
  sortOrderSchema,
  booleanQuerySchema,
  dateSchema,
  optionalDateSchema,
} from './common';

// GET /api/recurring-rules - Query params
export const getRecurringRulesQuerySchema = z.object({
  active: booleanQuerySchema.optional(),
  frequency: z.nativeEnum(Frequency).optional(),
  sortBy: z.enum(['merchant', 'nextDate', 'amount', 'updatedAt']).default('nextDate'),
  sortOrder: sortOrderSchema,
});

// POST /api/recurring-rules - Create recurring rule
export const createRecurringRuleSchema = z.object({
  accountId: z.string().uuid('Invalid account ID'),
  merchant: nonEmptyStringSchema.max(200, 'Merchant name must be 200 characters or less'),
  amount: currencyAmountSchema,
  type: z.nativeEnum(TransactionType),
  frequency: z.nativeEnum(Frequency),
  startDate: dateSchema,
  endDate: optionalDateSchema,
  nextDate: dateSchema,
  categoryId: z.string().uuid('Invalid category ID').optional(),
  subcategoryId: z.string().uuid('Invalid subcategory ID').optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
  autoCreate: z.boolean().default(false),
});

// PATCH /api/recurring-rules/[id] - Update recurring rule
export const updateRecurringRuleSchema = createRecurringRuleSchema.partial();

// GET /api/recurring-rules/upcoming - Query params
export const upcomingRecurringQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(30),
  accountId: z.string().uuid().optional(),
});

// POST /api/recurring-rules/detect - Detect recurring transactions
export const detectRecurringSchema = z.object({
  accountId: z.string().uuid().optional(),
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
  minOccurrences: z.number().int().min(2).max(10).default(3),
  amountVariancePercent: z.number().min(0).max(50).default(10), // Allow 10% variance
});
