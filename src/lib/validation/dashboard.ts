import { z } from 'zod';
import { timeframeSchema, optionalDateSchema } from './common';

// GET /api/dashboard/overview - Query params
export const dashboardOverviewQuerySchema = z.object({
  timeframe: timeframeSchema.default('month'),
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
});

// GET /api/dashboard/spending-trends - Query params
export const spendingTrendsQuerySchema = z.object({
  timeframe: timeframeSchema.default('12months'),
  categoryId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
});

// GET /api/dashboard/category-breakdown - Query params
export const categoryBreakdownQuerySchema = z.object({
  timeframe: timeframeSchema.default('month'),
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
  type: z.enum(['expense', 'income', 'all']).default('expense'),
});

// GET /api/dashboard/category-heatmap - Query params
export const categoryHeatmapQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).default(12),
  categoryId: z.string().uuid().optional(),
});

// GET /api/dashboard/category-correlation - Query params
export const categoryCorrelationQuerySchema = z.object({
  timeframe: timeframeSchema.default('12months'),
  minCorrelation: z.coerce.number().min(-1).max(1).default(0.3),
});

// GET /api/dashboard/cash-flow-sankey - Query params
export const cashFlowSankeyQuerySchema = z.object({
  timeframe: timeframeSchema.default('month'),
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
  minAmount: z.coerce.number().min(0).optional(),
});
