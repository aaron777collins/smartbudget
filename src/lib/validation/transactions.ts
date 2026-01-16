import { z } from 'zod';
import { TransactionType } from '@prisma/client';
import {
  currencyAmountSchema,
  nonEmptyStringSchema,
  sortOrderSchema,
  dateSchema,
  optionalDateSchema,
  booleanQuerySchema,
  paginationSchema,
  timeframeSchema,
} from './common';

// GET /api/transactions - Query params
export const getTransactionsQuerySchema = z
  .object({
    accountId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    subcategoryId: z.string().uuid().optional(),
    type: z.nativeEnum(TransactionType).optional(),
    startDate: optionalDateSchema,
    endDate: optionalDateSchema,
    minAmount: z.coerce.number().finite().optional(),
    maxAmount: z.coerce.number().finite().optional(),
    search: z.string().optional(),
    tags: z.string().optional(), // Comma-separated tag IDs
    excludeTags: z.string().optional(),
    uncategorizedOnly: booleanQuerySchema.optional(),
    sortBy: z
      .enum(['date', 'amount', 'merchant', 'category', 'createdAt'])
      .default('date'),
    sortOrder: sortOrderSchema,
  })
  .merge(paginationSchema);

// POST /api/transactions - Create transaction
export const createTransactionSchema = z.object({
  accountId: z.string().uuid('Invalid account ID'),
  date: dateSchema,
  merchant: nonEmptyStringSchema.max(200, 'Merchant name must be 200 characters or less'),
  amount: currencyAmountSchema,
  type: z.nativeEnum(TransactionType),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  subcategoryId: z.string().uuid('Invalid subcategory ID').optional(),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional(),
  tags: z.array(z.string().uuid()).optional(),
  isRecurring: z.boolean().default(false),
  recurringRuleId: z.string().uuid().optional(),
});

// PATCH /api/transactions/[id] - Update transaction
export const updateTransactionSchema = createTransactionSchema.partial();

// POST /api/transactions/[id]/split - Split transaction
export const splitTransactionSchema = z.object({
  splits: z
    .array(
      z.object({
        amount: currencyAmountSchema.positive('Split amount must be positive'),
        categoryId: z.string().uuid().optional(),
        subcategoryId: z.string().uuid().optional(),
        merchant: z.string().max(200).optional(),
        description: z.string().max(500).optional(),
      })
    )
    .min(2, 'At least 2 splits are required')
    .refine(
      (splits) => {
        // Total split amounts should equal the parent transaction amount
        // This will be checked in the API handler with the actual transaction amount
        return splits.every((s) => s.amount > 0);
      },
      { message: 'All split amounts must be positive' }
    ),
});

// POST /api/transactions/import - Import transactions
export const importTransactionsSchema = z.object({
  accountId: z.string().uuid('Invalid account ID'),
  fileType: z.enum(['csv', 'ofx', 'qfx']),
  file: z.instanceof(File).optional(), // In FormData
  // For CSV imports
  columnMapping: z
    .object({
      date: z.string().optional(),
      merchant: z.string().optional(),
      amount: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
    })
    .optional(),
  skipDuplicates: z.boolean().default(true),
});

// GET /api/transactions/export - Export query params
export const exportTransactionsQuerySchema = z.object({
  format: z.enum(['csv', 'pdf']),
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
});

// POST /api/transactions/categorize - Categorize transactions
export const categorizeTransactionSchema = z.object({
  transactionIds: z.array(z.string().uuid()).min(1, 'At least one transaction ID required'),
  method: z.enum(['rule', 'ml', 'hybrid']).default('hybrid'),
});
