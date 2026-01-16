import { z } from 'zod';
import { AccountType } from '@prisma/client';
import { currencyAmountSchema, nonEmptyStringSchema, sortOrderSchema, booleanQuerySchema } from './common';

// GET /api/accounts - Query params
export const getAccountsQuerySchema = z.object({
  active: booleanQuerySchema.optional(),
  sortBy: z.enum(['name', 'institution', 'currentBalance', 'updatedAt']).default('name'),
  sortOrder: sortOrderSchema,
});

// POST /api/accounts - Create account
export const createAccountSchema = z.object({
  name: nonEmptyStringSchema.max(100, 'Name must be 100 characters or less'),
  institution: z.string().max(100, 'Institution must be 100 characters or less').optional(),
  accountType: z.nativeEnum(AccountType),
  accountNumber: z.string().max(50, 'Account number must be 50 characters or less').optional(),
  currentBalance: currencyAmountSchema,
  icon: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format. Use hex format like #FF5733').optional(),
  isActive: z.boolean().default(true),
});

// PATCH /api/accounts/[id] - Update account
export const updateAccountSchema = createAccountSchema.partial();

// DELETE /api/accounts/[id] - No body validation needed, but we can validate query params
export const deleteAccountQuerySchema = z.object({
  transferToAccountId: z.string().uuid().optional(),
});
