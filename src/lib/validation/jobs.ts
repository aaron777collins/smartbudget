import { z } from 'zod';
import { JobStatus, JobType } from '@prisma/client';
import { sortOrderSchema, paginationSchema } from './common';

// GET /api/jobs - Query params
export const getJobsQuerySchema = z
  .object({
    status: z.nativeEnum(JobStatus).optional(),
    type: z.nativeEnum(JobType).optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'status', 'type']).default('createdAt'),
    sortOrder: sortOrderSchema,
  })
  .merge(paginationSchema);

// POST /api/jobs/process - Process jobs
export const processJobsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(5),
  jobType: z.nativeEnum(JobType).optional(),
});

// GET /api/jobs/[id] - Get single job (no query params needed)
export const getJobByIdSchema = z.object({
  includeDetails: z
    .string()
    .transform((val) => val === 'true' || val === '1')
    .or(z.boolean())
    .optional()
    .default(false),
});
