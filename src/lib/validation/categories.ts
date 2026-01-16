import { z } from 'zod';
import { nonEmptyStringSchema, sortOrderSchema } from './common';

// GET /api/categories - Query params
export const getCategoriesQuerySchema = z.object({
  includeSubcategories: z
    .string()
    .transform((val) => val === 'true' || val === '1')
    .or(z.boolean())
    .optional()
    .default(false),
  sortBy: z.enum(['name', 'transactionCount', 'updatedAt']).default('name'),
  sortOrder: sortOrderSchema,
});

// POST /api/categories - Create category
export const createCategorySchema = z.object({
  name: nonEmptyStringSchema.max(100, 'Name must be 100 characters or less'),
  icon: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format. Use hex format like #FF5733').optional(),
  isSystem: z.boolean().default(false),
});

// PATCH /api/categories/[id] - Update category
export const updateCategorySchema = createCategorySchema.partial().extend({
  // Can't change isSystem after creation
  isSystem: z.undefined(),
});

// POST /api/categories/[id]/subcategories - Create subcategory
export const createSubcategorySchema = z.object({
  name: nonEmptyStringSchema.max(100, 'Name must be 100 characters or less'),
  icon: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format. Use hex format like #FF5733').optional(),
});

// PATCH /api/categories/[id]/subcategories/[subcategoryId] - Update subcategory
export const updateSubcategorySchema = createSubcategorySchema.partial();
