import { z } from 'zod';
import { nonEmptyStringSchema } from './common';

// PATCH /api/user/settings - Update user settings
export const updateUserSettingsSchema = z.object({
  defaultCurrency: z.string().length(3, 'Currency code must be 3 characters (e.g., USD, EUR)').optional(),
  dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']).optional(),
  timeZone: z.string().optional(), // IANA timezone string
  theme: z.enum(['light', 'dark', 'system']).optional(),
  emailNotifications: z.boolean().optional(),
  budgetAlerts: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
});

// POST /api/auth/signup - User registration
export const signupSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  name: nonEmptyStringSchema.max(100, 'Name must be 100 characters or less').optional(),
});
