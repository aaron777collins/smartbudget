import { z } from 'zod';
import { GoalType } from '@prisma/client';
import {
  positiveAmountSchema,
  nonEmptyStringSchema,
  sortOrderSchema,
  booleanQuerySchema,
  dateSchema,
  optionalDateSchema,
} from './common';

// GET /api/goals - Query params
export const getGoalsQuerySchema = z.object({
  active: booleanQuerySchema.optional(),
  type: z.nativeEnum(GoalType).optional(),
  sortBy: z.enum(['name', 'targetAmount', 'targetDate', 'updatedAt']).default('targetDate'),
  sortOrder: sortOrderSchema,
});

// POST /api/goals - Create goal
export const createGoalSchema = z.object({
  name: nonEmptyStringSchema.max(100, 'Name must be 100 characters or less'),
  type: z.nativeEnum(GoalType),
  targetAmount: positiveAmountSchema,
  targetDate: optionalDateSchema,
  currentAmount: z.number().min(0).finite().default(0),
  accountId: z.string().uuid('Invalid account ID').optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  icon: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  isActive: z.boolean().default(true),
});

// PATCH /api/goals/[id] - Update goal
export const updateGoalSchema = createGoalSchema.partial();

// GET /api/goals/[id]/progress - Query params
export const goalProgressQuerySchema = z.object({
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
  granularity: z.enum(['day', 'week', 'month']).default('month'),
});
