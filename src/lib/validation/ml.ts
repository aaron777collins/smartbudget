import { z } from 'zod';

// POST /api/ml/train - Train ML model
export const trainMlModelSchema = z.object({
  force: z
    .string()
    .transform((val) => val === 'true' || val === '1')
    .or(z.boolean())
    .optional()
    .default(false),
  minSamples: z.coerce.number().int().min(10).max(10000).optional().default(100),
});

// GET /api/ml/stats - ML model statistics (no body params needed)
export const mlStatsQuerySchema = z.object({
  detailed: z
    .string()
    .transform((val) => val === 'true' || val === '1')
    .or(z.boolean())
    .optional()
    .default(false),
});
