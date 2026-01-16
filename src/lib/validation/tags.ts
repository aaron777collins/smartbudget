import { z } from 'zod';
import { nonEmptyStringSchema, sortOrderSchema } from './common';

// GET /api/tags - Query params
export const getTagsQuerySchema = z.object({
  search: z.string().optional(),
  sortBy: z.enum(['name', 'transactionCount', 'updatedAt']).default('name'),
  sortOrder: sortOrderSchema,
});

// POST /api/tags - Create tag
export const createTagSchema = z.object({
  name: nonEmptyStringSchema.max(50, 'Tag name must be 50 characters or less'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format. Use hex format like #FF5733').optional(),
});

// PATCH /api/tags/[id] - Update tag
export const updateTagSchema = createTagSchema.partial();

// POST /api/transactions/[id]/tags - Attach tags to transaction
export const attachTagsSchema = z.object({
  tagIds: z.array(z.string().uuid()).min(1, 'At least one tag ID required'),
});

// DELETE /api/transactions/[id]/tags - Detach tags from transaction
export const detachTagsSchema = z.object({
  tagIds: z.array(z.string().uuid()).min(1, 'At least one tag ID required'),
});
