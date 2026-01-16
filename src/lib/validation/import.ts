import { z } from 'zod';

// POST /api/import/parse-csv - Parse CSV file
export const parseCsvSchema = z.object({
  // File will be in FormData
  hasHeaders: z
    .string()
    .transform((val) => val === 'true' || val === '1')
    .or(z.boolean())
    .optional()
    .default(true),
  delimiter: z.string().max(1).optional().default(','),
});

// POST /api/import/parse-ofx - Parse OFX/QFX file
export const parseOfxSchema = z.object({
  // File will be in FormData
  // No additional parameters needed for OFX parsing
});
