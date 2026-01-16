import { z } from 'zod';
import { BudgetPeriod, BudgetType } from '@prisma/client';
import {
  positiveAmountSchema,
  nonEmptyStringSchema,
  sortOrderSchema,
  booleanQuerySchema,
  dateSchema,
  optionalDateSchema,
} from './common';

// GET /api/budgets - Query params
export const getBudgetsQuerySchema = z.object({
  active: booleanQuerySchema.optional(),
  type: z.nativeEnum(BudgetType).optional(),
  period: z.nativeEnum(BudgetPeriod).optional(),
  sortBy: z.enum(['name', 'amount', 'startDate', 'updatedAt']).default('name'),
  sortOrder: sortOrderSchema,
});

// POST /api/budgets - Create budget
export const createBudgetSchema = z.object({
  name: nonEmptyStringSchema.max(100, 'Name must be 100 characters or less'),
  type: z.nativeEnum(BudgetType),
  period: z.nativeEnum(BudgetPeriod),
  amount: positiveAmountSchema,
  startDate: dateSchema,
  endDate: optionalDateSchema,
  categoryId: z.string().uuid('Invalid category ID').optional(),
  subcategoryId: z.string().uuid('Invalid subcategory ID').optional(),
  accountId: z.string().uuid('Invalid account ID').optional(),
  rollover: z.boolean().default(false),
  alertThreshold: z.number().min(0).max(100).optional(), // Percentage (0-100)
  isActive: z.boolean().default(true),
});

// PATCH /api/budgets/[id] - Update budget
export const updateBudgetSchema = createBudgetSchema.partial();

// GET /api/budgets/[id]/progress - Query params
export const budgetProgressQuerySchema = z.object({
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
});

// GET /api/budgets/[id]/forecast - Query params
export const budgetForecastQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(12).default(3),
});

// GET /api/budgets/analytics - Query params
export const budgetAnalyticsQuerySchema = z.object({
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
  categoryId: z.string().uuid().optional(),
});

// GET /api/budgets/templates - Query params
export const budgetTemplatesQuerySchema = z.object({
  category: z.string().optional(),
});
