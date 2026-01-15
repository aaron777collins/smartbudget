/**
 * Comprehensive Zod validation schemas for API endpoints
 * Aligned with Prisma schema and security best practices
 */

import { z } from "zod";

// ==================== Common Validation Helpers ====================

// UUID validation
export const uuidSchema = z.string().uuid({ message: "Invalid UUID format" });

// Decimal validation for financial amounts (supports up to 19 digits, 4 decimal places)
export const decimalSchema = z
  .number()
  .or(z.string().regex(/^-?\d+(\.\d{1,4})?$/, "Invalid decimal format"))
  .transform((val) => (typeof val === "string" ? parseFloat(val) : val));

// Positive decimal for amounts that must be positive
export const positiveDecimalSchema = decimalSchema.refine(
  (val) => val > 0,
  "Amount must be positive"
);

// Non-negative decimal for balances
export const nonNegativeDecimalSchema = decimalSchema.refine(
  (val) => val >= 0,
  "Amount must be non-negative"
);

// Date validation (accepts Date object or ISO string)
export const dateSchema = z
  .string()
  .datetime({ message: "Invalid datetime format" })
  .or(z.date())
  .transform((val) => (typeof val === "string" ? new Date(val) : val));

// Color hex validation
export const colorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color format")
  .default("#2563EB");

// ==================== Enum Schemas ====================

export const accountTypeSchema = z.enum(
  ["CHECKING", "SAVINGS", "CREDIT_CARD", "INVESTMENT", "LOAN", "OTHER"],
  { required_error: "Account type is required" }
);

export const transactionTypeSchema = z.enum(["DEBIT", "CREDIT", "TRANSFER"], {
  required_error: "Transaction type is required",
});

export const budgetTypeSchema = z.enum(
  ["ENVELOPE", "PERCENTAGE", "FIXED_AMOUNT", "GOAL_BASED"],
  { required_error: "Budget type is required" }
);

export const budgetPeriodSchema = z.enum(
  ["WEEKLY", "BI_WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"],
  { required_error: "Budget period is required" }
);

export const goalTypeSchema = z.enum(
  ["SAVINGS", "DEBT_PAYOFF", "NET_WORTH", "INVESTMENT"],
  { required_error: "Goal type is required" }
);

export const frequencySchema = z.enum(
  ["WEEKLY", "BI_WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"],
  { required_error: "Frequency is required" }
);

export const feedbackTypeSchema = z.enum(
  ["bug", "feature", "improvement", "other"],
  { required_error: "Feedback type is required" }
);

export const feedbackPrioritySchema = z.enum(
  ["low", "medium", "high", "critical"],
  { required_error: "Priority is required" }
);

// ==================== Account Schemas ====================

export const createAccountSchema = z.object({
  name: z
    .string()
    .min(1, "Account name is required")
    .max(100, "Account name must be less than 100 characters")
    .trim(),
  institution: z
    .string()
    .min(1, "Institution is required")
    .max(100, "Institution name must be less than 100 characters")
    .trim(),
  accountType: accountTypeSchema,
  accountNumber: z
    .string()
    .max(50, "Account number must be less than 50 characters")
    .trim()
    .optional()
    .nullable(),
  currency: z.string().length(3, "Currency must be 3 characters").default("CAD"),
  currentBalance: decimalSchema,
  availableBalance: decimalSchema.optional().nullable(),
  color: colorSchema,
  icon: z.string().min(1).max(50).default("wallet"),
  isActive: z.boolean().default(true),
});

export const updateAccountSchema = createAccountSchema.partial();

// ==================== Transaction Schemas ====================

export const createTransactionSchema = z.object({
  accountId: uuidSchema,
  date: dateSchema,
  postedDate: dateSchema.optional().nullable(),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be less than 500 characters")
    .trim(),
  merchantName: z
    .string()
    .min(1, "Merchant name is required")
    .max(200, "Merchant name must be less than 200 characters")
    .trim(),
  amount: decimalSchema,
  type: transactionTypeSchema,
  categoryId: uuidSchema.optional().nullable(),
  subcategoryId: uuidSchema.optional().nullable(),
  notes: z.string().max(1000, "Notes must be less than 1000 characters").optional().nullable(),
  fitid: z.string().max(100).optional().nullable(),
  isReconciled: z.boolean().default(false),
  isRecurring: z.boolean().default(false),
  recurringRuleId: uuidSchema.optional().nullable(),
  rawData: z.any().optional().nullable(),
});

export const updateTransactionSchema = createTransactionSchema.partial().omit({
  accountId: true, // Don't allow changing the account
});

export const categorizeTransactionSchema = z.object({
  categoryId: uuidSchema,
  subcategoryId: uuidSchema.optional().nullable(),
  userCorrected: z.boolean().optional().default(true),
});

export const splitTransactionSchema = z.object({
  splits: z
    .array(
      z.object({
        categoryId: uuidSchema,
        amount: positiveDecimalSchema,
        percentage: z
          .number()
          .min(0)
          .max(100)
          .optional()
          .nullable(),
        notes: z.string().max(500).optional().nullable(),
      })
    )
    .min(2, "At least 2 splits are required")
    .refine(
      (splits) => {
        const total = splits.reduce((sum, split) => sum + Number(split.amount), 0);
        return total > 0;
      },
      { message: "Total split amount must be greater than zero" }
    ),
});

// ==================== Budget Schemas ====================

export const createBudgetSchema = z
  .object({
    name: z
      .string()
      .min(1, "Budget name is required")
      .max(100, "Budget name must be less than 100 characters")
      .trim(),
    type: budgetTypeSchema,
    period: budgetPeriodSchema,
    startDate: dateSchema,
    endDate: dateSchema.optional().nullable(),
    totalAmount: positiveDecimalSchema,
    isActive: z.boolean().default(true),
    rollover: z.boolean().default(false),
    categories: z
      .array(
        z.object({
          categoryId: uuidSchema,
          amount: positiveDecimalSchema,
        })
      )
      .optional(),
  })
  .refine(
    (data) => {
      // If endDate is provided, it must be after startDate
      if (data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

export const updateBudgetSchema = createBudgetSchema.partial();

// ==================== Goal Schemas ====================

export const createGoalSchema = z
  .object({
    name: z
      .string()
      .min(1, "Goal name is required")
      .max(100, "Goal name must be less than 100 characters")
      .trim(),
    type: goalTypeSchema,
    targetAmount: positiveDecimalSchema,
    currentAmount: nonNegativeDecimalSchema.default(0),
    targetDate: dateSchema.optional().nullable(),
    isCompleted: z.boolean().default(false),
    icon: z.string().max(50).optional().nullable(),
    color: colorSchema.optional().nullable(),
  })
  .refine(
    (data) => {
      // currentAmount should not exceed targetAmount
      return Number(data.currentAmount) <= Number(data.targetAmount);
    },
    {
      message: "Current amount cannot exceed target amount",
      path: ["currentAmount"],
    }
  );

export const updateGoalSchema = createGoalSchema.partial();

// ==================== Tag Schemas ====================

export const createTagSchema = z.object({
  name: z
    .string()
    .min(1, "Tag name is required")
    .max(50, "Tag name must be less than 50 characters")
    .trim(),
  color: colorSchema,
});

export const updateTagSchema = createTagSchema.partial();

// ==================== Recurring Rule Schemas ====================

export const createRecurringRuleSchema = z.object({
  merchantName: z
    .string()
    .min(1, "Merchant name is required")
    .max(200, "Merchant name must be less than 200 characters")
    .trim(),
  frequency: frequencySchema,
  amount: decimalSchema,
  categoryId: uuidSchema,
  nextDueDate: dateSchema,
});

export const updateRecurringRuleSchema = createRecurringRuleSchema.partial();

// ==================== Filter Preset Schemas ====================

export const createFilterPresetSchema = z.object({
  name: z
    .string()
    .min(1, "Preset name is required")
    .max(100, "Preset name must be less than 100 characters")
    .trim(),
  filters: z.record(z.any()), // JSON object containing filter configuration
});

export const updateFilterPresetSchema = createFilterPresetSchema.partial();

// ==================== User Settings Schemas ====================

export const updateUserSettingsSchema = z.object({
  currency: z.string().length(3, "Currency must be 3 characters").optional(),
  dateFormat: z
    .string()
    .regex(/^[MDY\/\-\.]+$/, "Invalid date format")
    .optional(),
  firstDayOfWeek: z.number().min(0).max(6).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  notificationsEnabled: z.boolean().optional(),
  emailDigest: z.boolean().optional(),
  digestFrequency: z.enum(["daily", "weekly", "monthly"]).optional(),
  budgetAlertThreshold: z.number().min(0).max(100).optional(),
  hasCompletedOnboarding: z.boolean().optional(),
  onboardingStep: z.number().min(0).max(10).optional(),
});

// ==================== Auth Schemas ====================

export const signupSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be less than 30 characters")
      .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")
      .trim(),
    email: z
      .string()
      .email("Invalid email address")
      .max(255, "Email must be less than 255 characters")
      .trim()
      .toLowerCase()
      .optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be less than 128 characters")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
    name: z.string().max(255).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ==================== Query Parameter Schemas ====================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const transactionQuerySchema = paginationSchema.extend({
  accountId: uuidSchema.optional(),
  categoryId: uuidSchema.optional(),
  type: transactionTypeSchema.optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  search: z.string().max(200).optional(),
  minAmount: decimalSchema.optional(),
  maxAmount: decimalSchema.optional(),
  isReconciled: z.coerce.boolean().optional(),
  // Security: Explicitly validate sortBy to prevent potential injection or invalid field access
  sortBy: z.enum([
    "date",
    "postedDate",
    "amount",
    "description",
    "merchantName",
    "type",
    "isReconciled",
    "isRecurring",
    "createdAt",
    "updatedAt"
  ]).default("date"),
});

export const accountQuerySchema = z.object({
  active: z.enum(["true", "false"]).optional(),
  search: z.string().max(200).optional(),
  sortBy: z.enum(["name", "institution", "accountType", "currentBalance"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

// ==================== Validation Helper Function ====================

/**
 * Validates request body against a Zod schema and returns typed errors
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Object with success boolean, data (if valid), and errors (if invalid)
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodIssue[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: result.error.issues };
}
