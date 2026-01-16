import { z } from 'zod';
import { nonEmptyStringSchema, sortOrderSchema } from './common';

// GET /api/filter-presets - Query params
export const getFilterPresetsQuerySchema = z.object({
  sortBy: z.enum(['name', 'updatedAt', 'usageCount']).default('name'),
  sortOrder: sortOrderSchema,
});

// POST /api/filter-presets - Create filter preset
export const createFilterPresetSchema = z.object({
  name: nonEmptyStringSchema.max(100, 'Name must be 100 characters or less'),
  filters: z.record(z.string(), z.any()), // Generic object to store filter state
  isDefault: z.boolean().default(false),
});

// PATCH /api/filter-presets/[id] - Update filter preset
export const updateFilterPresetSchema = createFilterPresetSchema.partial();
